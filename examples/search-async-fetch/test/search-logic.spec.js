
import expect from 'expect';
import { searchLogic } from '../src/search/logic';

describe('searchLogic', () => {
  describe('validate for valid search term', () => {
    let allow;
    let reject;
    beforeEach(done => {
      allow = expect.createSpy().andCall(() => done());
      reject = expect.createSpy();
      const action = { type: 'SEARCH', payload: 'foo' };
      searchLogic.validate({ action }, allow, reject);
    });

    it('should call allow with the valid action', () => {
      expect(allow.calls.length).toBe(1);
      expect(allow.calls[0].arguments[0]).toEqual({
        type: 'SEARCH', payload: 'foo'
      });
    });

    it('should not call reject', () => {
      expect(reject.calls.length).toBe(0);
    });
  });

  describe('validate for empty search term', () => {
    let allow;
    let reject;
    beforeEach(done => {
      allow = expect.createSpy();
      reject = expect.createSpy().andCall(() => done());
      const action = { type: 'SEARCH', payload: '' };
      searchLogic.validate({ action }, allow, reject);
    });

    it('should call reject with undefined', () => {
      expect(reject.calls.length).toBe(1);
      expect(reject.calls[0].arguments[0]).toBe(undefined);
    });

    it('should not call allow', () => {
      expect(allow.calls.length).toBe(0);
    });

  });

  describe('using valid url, process', () => {
    let dispatch;
    beforeEach(done => {
      const httpClient = {
        get(url) {
          return new Promise((resolve, reject) => {
            resolve({
              data: { // match shape of npmsearch.com
                results: [
                  { name: ['foo'], description: ['My foo'] }
                ]
              }
            });
          });
        }
      };

      dispatch = expect.createSpy().andCall(() => done());

      const action = { type: 'SEARCH', payload: 'foo' };
      searchLogic.process({ httpClient, action }, dispatch);
    });

    it('should dispatch action SEARCH_FULFILLED with results', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'SEARCH_FULFILLED',
        payload: [
          { name: ['foo'], description: ['My foo'] }
        ]
      });
    });
  });

  describe('invalid url, process', () => {
    let dispatch;
    beforeEach(done => {
      const httpClient = {
        get(url) {
          return new Promise((resolve, reject) => {
            reject(new Error('not found 404'));
          });
        }
      };

      dispatch = expect.createSpy().andCall(() => done());

      const action = { type: 'SEARCH', payload: 'foo' };
      searchLogic.process({ httpClient, action }, dispatch);
    });

    it('should dispatch action SEARCH_REJECTED', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type)
        .toBe('SEARCH_REJECTED');
      expect(dispatch.calls[0].arguments[0].error)
        .toBe(true);
      expect(dispatch.calls[0].arguments[0].payload)
        .toMatch(/404/);
    });
  });
});


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
});

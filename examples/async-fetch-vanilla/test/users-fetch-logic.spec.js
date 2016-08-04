
import expect from 'expect';
import { usersFetchLogic } from '../src/users/logic';

describe('usersFetchLogic', () => {
  describe('using valid url', () => {
    let dispatch;
    beforeEach((done) => {
      const httpClient = {
        get(url) {
          return new Promise((resolve, reject) => {
            resolve({
              data: { // match shape of reqres.in api
                data: [{ id: 1 }]
              }
            });
          });
        }
      };

      dispatch = expect.createSpy().andCall(() => done());

      usersFetchLogic.process({ httpClient }, dispatch);
    });

    it('should dispatch action USERS_FETCH_FULFILLED with users', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'USERS_FETCH_FULFILLED',
        payload: [{ id: 1 }]
      });
    });
  });

  describe('invalid url', () => {
    let dispatch;
    beforeEach((done) => {
      const httpClient = {
        get(url) {
          return new Promise((resolve, reject) => {
            reject(new Error('not found 404'));
          });
        }
      };

      dispatch = expect.createSpy().andCall(() => done());

      usersFetchLogic.process({ httpClient }, dispatch);
    });

    it('should dispatch action USERS_FETCH_REJECTED', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type)
        .toBe('USERS_FETCH_REJECTED');
      expect(dispatch.calls[0].arguments[0].error)
        .toBe(true);
      expect(dispatch.calls[0].arguments[0].payload)
        .toMatch(/404/);
    });
  });
});

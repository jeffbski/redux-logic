
import expect from 'expect';
import { fetchPollsLogic } from '../src/polls/logic';

describe('fetchPollsLogic', () => {
  describe('using valid url', () => {
    let dispatch;
    beforeEach((done) => {
      const httpClient = {
        get(url) {
          return new Promise((resolve, reject) => {
            resolve({
              data: {
                polls: [{ id: 1 }]
              }
            });
          });
        }
      };

      dispatch = expect.createSpy().andCall(() => done());

      fetchPollsLogic.process({ httpClient }, dispatch);
    });

    it('should dispatch action polls/FETCH_FULFILLED with polls', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'polls/FETCH_FULFILLED',
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

      fetchPollsLogic.process({ httpClient }, dispatch);
    });

    it('should dispatch action polls/FETCH_REJECTED', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type)
        .toBe('polls/FETCH_REJECTED');
      expect(dispatch.calls[0].arguments[0].error)
        .toBe(true);
      expect(dispatch.calls[0].arguments[0].payload)
        .toMatch(/404/);
    });
  });
});

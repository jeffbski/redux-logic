
import expect from 'expect';
import { usersFetchLogic } from '../src/users/logic';
import { Observable } from 'rxjs';

describe('usersFetchLogic', () => {
  describe('using valid url', () => {
    let results = [];
    beforeEach((done) => {
      const httpClient = {
        getJSON(url) {
          return Observable.of({
            data: [{ id: 1 }] // match shape of api of reqres.in
          });
        }
      };

      const dispatch = expect.createSpy().andCall((obs) => {
        obs.subscribe({
          next: x => results.push(x),
          complete: done
        });
      });

      usersFetchLogic.process({ httpClient }, dispatch);
    });

    it('should dispatch action users/FETCH_FULFILLED with users', () => {
      expect(results.length).toBe(1);
      expect(results[0]).toEqual({
        type: 'users/FETCH_FULFILLED',
        payload: [{ id: 1 }]
      });
    });
  });

  describe('invalid url', () => {
    const results = [];
    beforeEach((done) => {
      const httpClient = {
        getJSON(url) {
          return Observable.throw(new Error('not found 404'));
        }
      };

      const dispatch = expect.createSpy().andCall((obs) => {
        obs.subscribe({
          next: x => results.push(x),
          error: err => { console.log('error', err); },
          complete: done
        });
      });

      usersFetchLogic.process({ httpClient }, dispatch);
    });

    it('should dispatch action users/FETCH_REJECTED', () => {
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('users/FETCH_REJECTED');
      expect(results[0].error).toBe(true);
      expect(results[0].payload).toMatch(/404/);
    });
  });
});

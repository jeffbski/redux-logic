
import expect from 'expect';
import { usersFetchLogic } from '../src/users/logic';
import { of, throwError } from 'rxjs';

describe('usersFetchLogic', () => {
  describe('using valid url', () => {
    const results = [];
    beforeEach((done) => {
      const httpClient = url => {
        return of({ // match shape of reqres.in api
          data: [{ id: 1 }]
        });
      };

      usersFetchLogic.process({ httpClient })
        .subscribe({
          next: x => results.push(x),
          complete: done
        });
    });

    it('should return promise that resolves to users', () => {
      expect(results.length).toBe(1);
      expect(results[0]).toEqual([{ id: 1 }]);
    });
  });

  describe('invalid url', () => {
    let rejectedValue;
    beforeEach((done) => {
      const httpClient = url => {
        return throwError(new Error('not found 404'));
      };

      usersFetchLogic.process({ httpClient })
        .subscribe({
          error: err => {
            rejectedValue = err;
            done();
          }
        });
    });

    it('should reject to a 404 error', () => {
      expect(rejectedValue.message).toBe('not found 404');
    });
  });
});

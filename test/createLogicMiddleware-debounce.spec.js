import Rx from 'rxjs';
import expect from 'expect-legacy';
import { createLogic, createLogicMiddleware, configureLogic } from '../src/index';

describe('createLogicMiddleware-debounce', () => {

  before(() => {
    configureLogic({ warnTimeout: 0 });
  });

  after(() => {
    configureLogic({ warnTimeout: 60000 });
  });

  describe('[logicA] debounce validate async allow', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    beforeEach(done => {
      next = expect.createSpy().andCall(() => done());
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 0) {
          done();
        }
      }
      logicA = createLogic({
        type: 'FOO',
        debounce: 10,
        validate({ action }, allow) {
          setTimeout(() => {
            allow(action);
          }, 0);
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      storeFn(actionFoo2);
    });

    it('passes only actionFoo2 since validate async', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo2);
    });

    it('no dispatches', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('[logicA] debounce validate async reject', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    beforeEach(done => {
      next = expect.createSpy().andCall(() => done());
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 0) {
          done();
        }
      }
      logicA = createLogic({
        type: 'FOO',
        debounce: 10,
        validate({ action }, allow, reject) {
          setTimeout(() => {
            reject(action);
          }, 0);
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      storeFn(actionFoo2);
    });

    it('passes only actionFoo2 since validate async', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo2);
    });

    it('no dispatches', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('[logicA] debounce next async', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    const actionResult = { type: 'FOO', id: 2, trans: ['a'] };
    beforeEach(done => {
      next = expect.createSpy().andCall(() => done());
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 0) {
          done();
        }
      }
      logicA = createLogic({
        type: 'FOO',
        debounce: 10,
        transform({ action }, next) {
          setTimeout(() => {
            next({
              ...action,
              trans: ['a']
            });
          }, 0);
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      storeFn(actionFoo2);
    });

    it('passes only actionFoo2 since validate async', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionResult);
    });

    it('no dispatches', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('[logicA] debounce process', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    const actionResultFoo2 = { type: 'BAR', id: 2 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 1) { done(); }
      }
      logicA = createLogic({
        type: 'FOO',
        debounce: 10,
        process({ action }, dispatch) {
          setTimeout(() => {
            dispatch({
              ...action,
              type: 'BAR'
            });
          }, 20);
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      setTimeout(() => {
        storeFn(actionFoo2);
      }, 0);
    });

    it('passes only actionFoo2', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo2);
    });

    it('dispatch only actionResult2', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResultFoo2);
    });
  });

  describe('[logicA] debounce process syncDispatch(x, true) dispatch(y)', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    const actionSyncResult2 = { type: 'BAR', id: 2 };
    const actionResultFoo2 = { type: 'CAT', id: 2 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) { done(); }
      }
      logicA = createLogic({
        type: 'FOO',
        debounce: 30,
        process({ action }, dispatch) {
          // immediate dispatch
          dispatch({
            ...action,
            type: 'BAR'
          }, { allowMore: true });

          // followed by later async dispatch
          setTimeout(() => {
            dispatch({
              ...action,
              type: 'CAT'
            });
          }, 50);
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      setTimeout(() => {
        storeFn(actionFoo2);
      }, 15);
    });

    it('passes only actionFoo2', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo2);
    });

    it('dispatch only sync2, async2', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionSyncResult2);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionResultFoo2);
    });
  });

  describe('[logicA] debounce process obs(sync x, async y)', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    const actionSyncResult2 = { type: 'BAR', id: 2 };
    const actionResultFoo2 = { type: 'CAT', id: 2 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) { done(); }
      }
      logicA = createLogic({
        type: 'FOO',
        debounce: 20,
        process({ action }, dispatch) {
          dispatch(Rx.Observable.create(obs => {
            // immediate dispatch
            obs.next({
              ...action,
              type: 'BAR'
            });

            // followed by later async dispatch
            setTimeout(() => {
              obs.next({
                ...action,
                type: 'CAT'
              });
            }, 30);
          }));
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      setTimeout(() => {
        storeFn(actionFoo2);
      }, 10);
    });

    it('passes actionFoo2', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo2);
    });

    it('dispatch only sync1, async1', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionSyncResult2);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionResultFoo2);
    });
  });
});

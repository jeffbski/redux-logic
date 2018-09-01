import Rx from 'rxjs';
import expect from 'expect-legacy';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware-latest', () => {
  describe('[logicA] latest=falsey validate async allow', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    beforeEach(done => {
      next = expect.createSpy().andCall(nextCb);
      let nextCount = 0;
      function nextCb() {
        if (++nextCount >= 2) { done(); }
      }
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 0) { done(); }
      }
      logicA = createLogic({
        type: 'FOO',
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

    it('passes both actionFoo1 and actionFoo2', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo1);
      expect(next.calls[1].arguments[0]).toEqual(actionFoo2);
    });

    it('no dispatches', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });
  });

  describe('[logicA] latest=falsey process', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    const actionResultFoo1 = { type: 'BAR', id: 1 };
    const actionResultFoo2 = { type: 'BAR', id: 2 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) { done(); }
      }
      logicA = createLogic({
        type: 'FOO',
        process({ action }, dispatch) {
          dispatch({
            ...action,
            type: 'BAR'
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      storeFn(actionFoo2);
    });

    it('passes both actionFoo1 and actionFoo2', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo1);
      expect(next.calls[1].arguments[0]).toEqual(actionFoo2);
    });

    it('dispatch actionResult1 and actionResult2', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResultFoo1);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionResultFoo2);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] latest validate async allow', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 0) {
          // letting whenComplete let us know when we are done
          // done();
        }
      }
      logicA = createLogic({
        type: 'FOO',
        latest: true,
        validate({ action }, allow) {
          setTimeout(() => {
            allow(action);
          }, 0);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      storeFn(actionFoo2);
      mw.whenComplete(done);
    });

    it('take only latest, passes only actionFoo2 since validate async', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo2);
    });

    it('no dispatches', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', id: 1 }, op: 'top' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 2 }, op: 'top' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 1 },
          name: 'L(FOO)-0',
          op: 'cancelled' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'end' },
        { action: { type: 'FOO', id: 1 },
          nextAction: { type: 'FOO', id: 1 },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { action: { type: 'FOO', id: 2 },
          nextAction: { type: 'FOO', id: 2 },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', id: 2 }, op: 'bottom' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] latest validate async reject', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 0) {
          // whenComplete is calling done
          // done();
        }
      }
      logicA = createLogic({
        type: 'FOO',
        latest: true,
        validate({ action }, allow, reject) {
          setTimeout(() => {
            reject(action);
          }, 0);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      storeFn(actionFoo2);
      mw.whenComplete(done);
    });

    it('take only latest, passes only actionFoo2 since validate async', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo2);
    });

    it('no dispatches', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', id: 1 }, op: 'top' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 2 }, op: 'top' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 1 },
          name: 'L(FOO)-0',
          op: 'cancelled' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'end' },
        { action: { type: 'FOO', id: 1 },
          nextAction: { type: 'FOO', id: 1 },
          name: 'L(FOO)-0',
          shouldProcess: false,
          op: 'next' },
        { action: { type: 'FOO', id: 2 },
          nextAction: { type: 'FOO', id: 2 },
          name: 'L(FOO)-0',
          shouldProcess: false,
          op: 'next' },
        { nextAction: { type: 'FOO', id: 2 }, op: 'bottom' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] latest next async', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    const actionResult = { type: 'FOO', id: 2, trans: ['a'] };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 0) {
          // whenComplete is calling done
          //           done();
        }
      }
      logicA = createLogic({
        type: 'FOO',
        latest: true,
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
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      storeFn(actionFoo2);
      mw.whenComplete(done);
    });

    it('take only latest, passes only actionFoo2 since validate async', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionResult);
    });

    it('no dispatches', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', id: 1 }, op: 'top' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 2 }, op: 'top' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 1 },
          name: 'L(FOO)-0',
          op: 'cancelled' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'end' },
        { action: { type: 'FOO', id: 1 },
          nextAction: { type: 'FOO', id: 1, trans: ['a'] },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { action: { type: 'FOO', id: 2 },
          nextAction: { type: 'FOO', id: 2, trans: ['a'] },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', id: 2, trans: ['a'] },
          op: 'bottom' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] latest process', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    const actionResultFoo2 = { type: 'BAR', id: 2 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        latest: true,
        process({ action }, dispatch) {
          setTimeout(() => {
            dispatch({
              ...action,
              type: 'BAR'
            });
          }, 100); // needs to be delayed so we can check next calls
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      setTimeout(() => {
        storeFn(actionFoo2);
      }, 0);
      mw.whenComplete(done);
    });

    it('passes both actionFoo1 and actionFoo2', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo1);
      expect(next.calls[1].arguments[0]).toEqual(actionFoo2);
    });

    it('dispatch only actionResult2', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResultFoo2);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', id: 1 }, op: 'top' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 1 },
          nextAction: { type: 'FOO', id: 1 },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', id: 1 }, op: 'bottom' },
        { action: { type: 'FOO', id: 2 }, op: 'top' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 2 },
          nextAction: { type: 'FOO', id: 2 },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', id: 2 }, op: 'bottom' },
        { action: { type: 'FOO', id: 1 },
          name: 'L(FOO)-0',
          op: 'dispCancelled' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'end' },
        { action: { type: 'FOO', id: 2 },
          dispAction: { type: 'BAR', id: 2 },
          op: 'dispatch' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] latest process syncDispatch(x, true) dispatch(y)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    const actionSyncResult1 = { type: 'BAR', id: 1 };
    const actionSyncResult2 = { type: 'BAR', id: 2 };
    const actionResultFoo2 = { type: 'CAT', id: 2 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        latest: true,
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
          }, 20);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      setTimeout(() => {
        storeFn(actionFoo2);
      }, 10);
      mw.whenComplete(done);
    });

    it('passes both actionFoo1 and actionFoo2', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo1);
      expect(next.calls[1].arguments[0]).toEqual(actionFoo2);
    });

    it('dispatch only sync1, sync2, async2', () => {
      expect(dispatch.calls.length).toBe(3);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionSyncResult1);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionSyncResult2);
      expect(dispatch.calls[2].arguments[0]).toEqual(actionResultFoo2);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', id: 1 }, op: 'top' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 1 },
          nextAction: { type: 'FOO', id: 1 },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', id: 1 }, op: 'bottom' },
        { action: { type: 'FOO', id: 1 },
          dispAction: { type: 'BAR', id: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO', id: 2 }, op: 'top' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 2 },
          nextAction: { type: 'FOO', id: 2 },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', id: 2 }, op: 'bottom' },
        { action: { type: 'FOO', id: 2 },
          dispAction: { type: 'BAR', id: 2 },
          op: 'dispatch' },
        { action: { type: 'FOO', id: 1 },
          name: 'L(FOO)-0',
          op: 'dispCancelled' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'end' },
        { action: { type: 'FOO', id: 2 },
          dispAction: { type: 'CAT', id: 2 },
          op: 'dispatch' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] latest process obs(sync x, async y)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo1 = { type: 'FOO', id: 1 };
    const actionFoo2 = { type: 'FOO', id: 2 };
    const actionSyncResult1 = { type: 'BAR', id: 1 };
    const actionSyncResult2 = { type: 'BAR', id: 2 };
    const actionResultFoo2 = { type: 'CAT', id: 2 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        latest: true,
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
              obs.complete();
            }, 30);
          }));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo1);
      setTimeout(() => {
        storeFn(actionFoo2);
      }, 10);
      mw.whenComplete(done);
    });

    it('passes both actionFoo1 and actionFoo2', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo1);
      expect(next.calls[1].arguments[0]).toEqual(actionFoo2);
    });

    it('dispatch only sync1, sync2, async2', () => {
      expect(dispatch.calls.length).toBe(3);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionSyncResult1);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionSyncResult2);
      expect(dispatch.calls[2].arguments[0]).toEqual(actionResultFoo2);
    });

    it('mw.monitor$ should track the flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', id: 1 }, op: 'top' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 1 },
          nextAction: { type: 'FOO', id: 1 },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', id: 1 }, op: 'bottom' },
        { action: { type: 'FOO', id: 1 },
          dispAction: { type: 'BAR', id: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO', id: 2 }, op: 'top' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO', id: 2 },
          nextAction: { type: 'FOO', id: 2 },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', id: 2 }, op: 'bottom' },
        { action: { type: 'FOO', id: 2 },
          dispAction: { type: 'BAR', id: 2 },
          op: 'dispatch' },
        { action: { type: 'FOO', id: 1 },
          name: 'L(FOO)-0',
          op: 'dispCancelled' },
        { action: { type: 'FOO', id: 1 }, name: 'L(FOO)-0', op: 'end' },
        { action: { type: 'FOO', id: 2 },
          dispAction: { type: 'CAT', id: 2 },
          op: 'dispatch' },
        { action: { type: 'FOO', id: 2 }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

});

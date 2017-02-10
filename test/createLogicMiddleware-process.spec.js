import Rx from 'rxjs';
import expect from 'expect';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware-process', () => {
  describe('[logicA] process dispatch()', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches nothing', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(x)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    let dispatchReturnValue;
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatchReturnValue = dispatch(actionBar);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('dispatch should also return its value', () => {
      expect(dispatchReturnValue).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(null)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: null };
    let dispatchReturnValue;
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatchReturnValue = dispatch(actionBar);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('dispatch should also return its value', () => {
      expect(dispatchReturnValue).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: null },
          op: 'dispatch' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process throws error without type', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        process() {
          const err = new Error('my error');
          throw err;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches UNHANDLED_LOGIC_ERROR', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('UNHANDLED_LOGIC_ERROR');
      expect(dispatch.calls[0].arguments[0].payload.message).toBe('my error');
      expect(dispatch.calls[0].arguments[0].error).toBe(true);
    });

    it('mw.monitor$ should track flow', () => {
      // simplify error
      monArr = monArr.map(x => {
        if (x.dispAction) {
          return {
            ...x,
            dispAction: {
              ...x.dispAction,
              payload: x.dispAction.payload.message
            }
          };
        }
        return x;
      });

      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction:
                     { type: 'UNHANDLED_LOGIC_ERROR',
                       payload: 'my error', // simplified for test
                       error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process throws error with type', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        process() {
          const err = new Error('my error');
          err.type = 'BAR_ERROR';
          throw err;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches erroredObject', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('BAR_ERROR');
    });

    it('mw.monitor$ should track flow', () => {
      // simplify error
      monArr = monArr.map(x => {
        if (x.dispAction) {
          return {
            ...x,
            dispAction: x.dispAction.message
          };
        }
        return x;
      });

      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: 'my error', // simplified for test
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process runtime error', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        process() {
          // access xyz of null to cause a runtime error
          const a = null;
          const z = a.xyz; // should cause runtime error
          return z;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches UNHANDLED_LOGIC_ERROR', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('UNHANDLED_LOGIC_ERROR');
      expect(dispatch.calls[0].arguments[0].payload.message).toMatch('Cannot read property');
      expect(dispatch.calls[0].arguments[0].error).toBe(true);
    });

    it('mw.monitor$ should track flow', () => {
      // simplify error
      monArr = monArr.map(x => {
        if (x.dispAction) {
          return {
            ...x,
            dispAction: {
              ...x.dispAction,
              payload: x.dispAction.payload.message
            }
          };
        }
        return x;
      });

      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction:
                     { type: 'UNHANDLED_LOGIC_ERROR',
                       payload: 'Cannot read property \'xyz\' of null',
                       error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });
  });

  describe('[logicA] process DEPR dispatch(x, { allowMore: true }) dispatch(y)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) {
          // handling with whenComplete()
          // done();
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch(actionBar, { allowMore: true });
          dispatch(actionCat);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar and actionCat', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process DEPR dispatch(x, { allowMore: true }) dispatch()', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 1) {
          // done();
          // use whenComplete to trigger done
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch(actionBar, { allowMore: true });
          dispatch();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(x) dispatch(y) done()', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) {
          // handling with whenComplete()
          // done();
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch, done) {
          dispatch(actionBar);
          dispatch(actionCat);
          done();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar and actionCat', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchMultiple:true dispatch(x) dispatch(y) cancel', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    const actionFooCancel = { type: 'FOO_CANCEL' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) {
          // handling with whenComplete()
          // done();
        }
      }
      logicA = createLogic({
        type: 'FOO',
        cancelType: 'FOO_CANCEL',
        processOptions: {
          dispatchMultiple: true
        },
        process(deps, dispatch) { // never ends but is cancelled
          dispatch(actionBar);
          dispatch(actionCat);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionFoo);
      mw.whenComplete(done);
      setTimeout(() => { storeFn(actionFooCancel); }, 100);
    });

    it('passes actionFoo and foo_cancel through next', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
      expect(next.calls[1].arguments[0]).toEqual(actionFooCancel);
    });

    it('dispatches actionBar and actionCat', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO_CANCEL' }, op: 'top' },
        { nextAction: { type: 'FOO_CANCEL' }, op: 'bottom' },
        { action: { type: 'FOO' },
          name: 'L(FOO)-0',
          op: 'dispCancelled' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(x) dispatch() done()', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 1) {
          // done();
          // use whenComplete to trigger done
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch, done) {
          dispatch(actionBar);
          dispatch();
          done();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(obs)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) {
          // done();
          // whenComplete triggers done
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch(Rx.Observable.of(actionBar, actionCat));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar and actionCat', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(obs, { allowMore: true }) dispatch()', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) {
          // done();
          // whenComplete triggers done
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch(Rx.Observable.of(actionBar, actionCat),
                   { allowMore: true });
          dispatch();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar and actionCat', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(obs, { allowMore: true }) dispatch(x)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    const actionDog = { type: 'DOG', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 3) {
          // done();
          // use whenComplete to trigger done
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch(Rx.Observable.of(actionBar, actionCat),
                   { allowMore: true });
          dispatch(actionDog);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar actionCat actionDog', () => {
      expect(dispatch.calls.length).toBe(3);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
      expect(dispatch.calls[2].arguments[0]).toEqual(actionDog);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'DOG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(obs, AM) dispatch(obs, AM) dispatch()', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    const actionDog = { type: 'DOG', a: 1 };
    const actionEgg = { type: 'EGG', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 4) {
          // done();
          // use whenComplete to trigger done
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch(Rx.Observable.of(actionBar, actionCat),
                   { allowMore: true });
          dispatch(Rx.Observable.of(actionDog, actionEgg),
                   { allowMore: true });
          dispatch();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar actionCat actionDog actionEgg', () => {
      expect(dispatch.calls.length).toBe(4);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
      expect(dispatch.calls[2].arguments[0]).toEqual(actionDog);
      expect(dispatch.calls[3].arguments[0]).toEqual(actionEgg);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'DOG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'EGG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(obs, AM) dispatch(obs, AM) dispatch(x)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    const actionDog = { type: 'DOG', a: 1 };
    const actionEgg = { type: 'EGG', a: 1 };
    const actionFig = { type: 'FIG', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 5) {
          // done();
          // use whenComplete to trigger done
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch(Rx.Observable.of(actionBar, actionCat),
                   { allowMore: true });
          dispatch(Rx.Observable.of(actionDog, actionEgg),
                   { allowMore: true });
          dispatch(actionFig);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar actionCat actionDog actionEgg actionFig', () => {
      expect(dispatch.calls.length).toBe(5);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
      expect(dispatch.calls[2].arguments[0]).toEqual(actionDog);
      expect(dispatch.calls[3].arguments[0]).toEqual(actionEgg);
      expect(dispatch.calls[4].arguments[0]).toEqual(actionFig);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'DOG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'EGG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'FIG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });


  // using the new done multi-dispatch approach

  describe('[logicA] process dispatch(obs) dispatch() done()', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) {
          // done();
          // whenComplete triggers done
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch, done) {
          dispatch(Rx.Observable.of(actionBar, actionCat));
          dispatch();
          done();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar and actionCat', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(obs) dispatch(x) done()', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    const actionDog = { type: 'DOG', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 3) {
          // done();
          // use whenComplete to trigger done
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch, done) {
          dispatch(Rx.Observable.of(actionBar, actionCat));
          dispatch(actionDog);
          done();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar actionCat actionDog', () => {
      expect(dispatch.calls.length).toBe(3);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
      expect(dispatch.calls[2].arguments[0]).toEqual(actionDog);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'DOG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(obs) dispatch(obs) done()', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    const actionDog = { type: 'DOG', a: 1 };
    const actionEgg = { type: 'EGG', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 4) {
          // done();
          // use whenComplete to trigger done
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch, done) {
          dispatch(Rx.Observable.of(actionBar, actionCat));
          dispatch(Rx.Observable.of(actionDog, actionEgg));
          done();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar actionCat actionDog actionEgg', () => {
      expect(dispatch.calls.length).toBe(4);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
      expect(dispatch.calls[2].arguments[0]).toEqual(actionDog);
      expect(dispatch.calls[3].arguments[0]).toEqual(actionEgg);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'DOG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'EGG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatch(obs) dispatch(obs) dispatch(x) done()', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    const actionDog = { type: 'DOG', a: 1 };
    const actionEgg = { type: 'EGG', a: 1 };
    const actionFig = { type: 'FIG', a: 1 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 5) {
          // done();
          // use whenComplete to trigger done
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch, done) {
          dispatch(Rx.Observable.of(actionBar, actionCat));
          dispatch(Rx.Observable.of(actionDog, actionEgg));
          dispatch(actionFig);
          done();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar actionCat actionDog actionEgg actionFig', () => {
      expect(dispatch.calls.length).toBe(5);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCat);
      expect(dispatch.calls[2].arguments[0]).toEqual(actionDog);
      expect(dispatch.calls[3].arguments[0]).toEqual(actionEgg);
      expect(dispatch.calls[4].arguments[0]).toEqual(actionFig);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'CAT', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'DOG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'EGG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'FIG', a: 1 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process successType=BAR dispatch(42)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', payload: 42 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          successType: 'BAR'
        },
        process(deps, dispatch) {
          dispatch(42);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: 42 }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 42 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process successType=BarFn dispatch(42)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          successType: actionBarFn
        },
        process(deps, dispatch) {
          dispatch(42);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBarFn(42)', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBarFn(42));
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 42 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process failType=BAZ dispatch(error)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          failType: 'BAZ'
        },
        process(deps, dispatch) {
          dispatch(new Error('my error'));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: err, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('BAZ');
      expect(dispatch.calls[0].arguments[0].payload.message).toBe('my error');
      expect(dispatch.calls[0].arguments[0].error).toBe(true);
    });

    it('mw.monitor$ should track flow', () => {
      // simplify error
      monArr = monArr.map(x => {
        if (x.dispAction) {
          return {
            ...x,
            dispAction: {
              ...x.dispAction,
              payload: x.dispAction.payload.message
            }
          };
        }
        return x;
      });

      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction:
                     { type: 'BAZ',
                       payload: 'my error',
                       error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process failType=BazFn dispatch(error)', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          failType: actionBazFn
        },
        process(deps, dispatch) {
          dispatch(new Error('my error'));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: err, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('BAZ');
      expect(dispatch.calls[0].arguments[0].payload.message).toBe('my error');
      expect(dispatch.calls[0].arguments[0].error).toBe(true);
    });

    it('mw.monitor$ should track flow', () => {
      // simplify error
      monArr = monArr.map(x => {
        if (x.dispAction) {
          return {
            ...x,
            dispAction: {
              ...x.dispAction,
              payload: x.dispAction.payload.message
            }
          };
        }
        return x;
      });

      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction:
                     { type: 'BAZ',
                       payload: 'my error',
                       error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process failType=BAZ throw error', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          failType: 'BAZ'
        },
        process() {
          throw new Error('my error');
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: err, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('BAZ');
      expect(dispatch.calls[0].arguments[0].payload.message).toBe('my error');
      expect(dispatch.calls[0].arguments[0].error).toBe(true);
    });

    it('mw.monitor$ should track flow', () => {
      // simplify error
      monArr = monArr.map(x => {
        if (x.dispAction) {
          return {
            ...x,
            dispAction: {
              ...x.dispAction,
              payload: x.dispAction.payload.message
            }
          };
        }
        return x;
      });

      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction:
                     { type: 'BAZ',
                       payload: 'my error',
                       error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process failType=BazFn throw error', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          failType: actionBazFn
        },
        process() {
          throw new Error('my error');
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: err, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('BAZ');
      expect(dispatch.calls[0].arguments[0].payload.message).toBe('my error');
      expect(dispatch.calls[0].arguments[0].error).toBe(true);
    });

    it('mw.monitor$ should track flow', () => {
      // simplify error
      monArr = monArr.map(x => {
        if (x.dispAction) {
          return {
            ...x,
            dispAction: {
              ...x.dispAction,
              payload: x.dispAction.payload.message
            }
          };
        }
        return x;
      });

      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction:
                     { type: 'BAZ',
                       payload: 'my error',
                       error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return undefined', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          return; // eslint-disable-line no-useless-return
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches nothing', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return { type: BAR }', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          return actionBar;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR' },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process omit dispatch infers dispatchReturn:true return { type: BAR }', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        process() { // no dispatch, dispatchReturn defaults to true
          return actionBar;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR' },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process incl but dispatchReturn:true over return { type: BAR }', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true // overriding the default due to process sig
        },
        process(deps, dispatch) { // eslint-disable-line no-unused-vars
          return actionBar;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR' },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return error without type', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          const err = new Error('my error');
          return err;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches UNHANDLED_LOGIC_ERROR', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('UNHANDLED_LOGIC_ERROR');
      expect(dispatch.calls[0].arguments[0].payload.message).toBe('my error');
      expect(dispatch.calls[0].arguments[0].error).toBe(true);
    });

    it('mw.monitor$ should track flow', () => {
      // simplify error
      monArr = monArr.map(x => {
        if (x.dispAction) {
          return {
            ...x,
            dispAction: {
              ...x.dispAction,
              payload: x.dispAction.payload.message
            }
          };
        }
        return x;
      });

      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction:
                     { type: 'UNHANDLED_LOGIC_ERROR',
                       payload: 'my error',
                       error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return error with type', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          const err = new Error('my error');
          err.type = 'BAR_ERROR';
          return err;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches erroredObject', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('BAR_ERROR');
    });

    it('mw.monitor$ should track flow', () => {
      // simplify error
      monArr = monArr.map(x => {
        if (x.dispAction) {
          return {
            ...x,
            dispAction: x.dispAction.message
          };
        }
        return x;
      });

      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: 'my error',
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return promise', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          return new Promise(resolve => resolve(actionBar));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR' },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return promise undefined', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          return new Promise(resolve => resolve(undefined));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('does not dispatch', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return rejecting promise', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', error: true };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          return new Promise((resolve, reject) => reject(actionBar));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return rejecting promise undefined', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          return new Promise((resolve, reject) => reject(undefined));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('does not dispatch', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return obs', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          return Rx.Observable.create(obs => {
            obs.next(actionBar);
            obs.complete();
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR' },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return obs undefined', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          return Rx.Observable.create(obs => {
            obs.next(undefined);
            obs.complete();
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('does not dispatch', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return error obs', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', error: true };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          return Rx.Observable.create(obs => obs.error(actionBar));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true return error obs undefined', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          return Rx.Observable.create(obs => obs.error(undefined));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('does not dispatch', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  // successType and failType string type variants

  describe('[logicA] process dispatchReturn:true successType return undefined', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: 'BAR'
        },
        process() {
          return; // eslint-disable-line no-useless-return
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches nothing', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true successType=BAR return null', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionResult = { type: 'BAR', payload: null };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: 'BAR'
        },
        process() {
          return null;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: null }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        {
          action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next'
        },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        {
          action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: null },
          op: 'dispatch'
        },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true successType=BAR return 42', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionResult = { type: 'BAR', payload: 42 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: 'BAR'
        },
        process() {
          return 42;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: 42 }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        {
          action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next'
        },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        {
          action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 42 },
          op: 'dispatch'
        },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true failType return error', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          failType: 'BAZ'
        },
        process() {
          const err = new Error('my error');
          return err;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches erroredObject', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('BAZ');
      expect(dispatch.calls[0].arguments[0].payload.message).toBe('my error');
      expect(dispatch.calls[0].arguments[0].error).toBe(true);
    });

    it('mw.monitor$ should track flow', () => {
      // simplify error
      monArr = monArr.map(x => {
        if (x.dispAction) {
          return {
            ...x,
            dispAction: {
              ...x.dispAction,
              payload: x.dispAction.payload.message
            }
          };
        }
        return x;
      });

      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction:
                     { type: 'BAZ',
                       payload: 'my error',
                       error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true successType=BAR return promise null', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: 'BAR'
        },
        process() {
          return new Promise(resolve => resolve(null));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: null }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'BAR',
        payload: null
      });
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: null },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true successType=BAR return promise 42', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: 'BAR'
        },
        process() {
          return new Promise(resolve => resolve(42));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: 42 }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'BAR',
        payload: 42
      });
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 42 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true failType return rejecting promise 32', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionResult = { type: 'BAZ', payload: 32, error: true };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          failType: 'BAZ'
        },
        process() {
          return new Promise((resolve, reject) => reject(32));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: 32, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAZ', payload: 32, error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true successType return obs 42, 43', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionResult = { type: 'BAR', payload: 42 };
    const actionResult2 = { type: 'BAR', payload: 43 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: 'BAR'
        },
        process() {
          return Rx.Observable.create(obs => {
            obs.next(42);
            obs.next(43);
            obs.complete();
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches two actions of BAR with 42, 43 }', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionResult2);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 42 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 43 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true failType return error obs 32', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionResult = { type: 'BAZ', payload: 32, error: true };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          failType: 'BAZ'
        },
        process() {
          return Rx.Observable.create(obs => obs.error(32));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: 32, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAZ', payload: 32, error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  // successType and failType action creator fn variants

  describe('[logicA] process dispatchReturn:true successType=fn return undefined', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: actionBarFn
        },
        process() {
          return; // eslint-disable-line no-useless-return
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches nothing', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true successType=fn return null', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    const actionResult = { type: 'BAR', payload: null };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: actionBarFn
        },
        process() {
          return null;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: null }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: null },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true successType=fn return 42', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    const actionResult = { type: 'BAR', payload: 42 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: actionBarFn
        },
        process() {
          return 42;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: 42 }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 42 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true failType=fn return error', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });

    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          failType: actionBazFn
        },
        process() {
          const err = new Error('my error');
          return err;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches erroredObject', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('BAZ');
      expect(dispatch.calls[0].arguments[0].payload.message).toBe('my error');
      expect(dispatch.calls[0].arguments[0].error).toBe(true);
    });

    it('mw.monitor$ should track flow', () => {
      // simplify error
      monArr = monArr.map(x => {
        if (x.dispAction) {
          return {
            ...x,
            dispAction: {
              ...x.dispAction,
              payload: x.dispAction.payload.message
            }
          };
        }
        return x;
      });

      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction:
                     { type: 'BAZ',
                       payload: 'my error',
                       error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true successType=fn return promise null', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: actionBarFn
        },
        process() {
          return new Promise(resolve => resolve(null));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: null }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'BAR',
        payload: null
      });
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: null },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true successType=fn return promise 42', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: actionBarFn
        },
        process() {
          return new Promise(resolve => resolve(42));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: 42 }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'BAR',
        payload: 42
      });
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 42 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true failType=fn return rejecting promise 32', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });
    const actionResult = { type: 'BAZ', payload: 32, error: true };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          failType: actionBazFn
        },
        process() {
          return new Promise((resolve, reject) => reject(32));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: 32, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAZ', payload: 32, error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true successType=fn return obs 42, 43', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    const actionResult = { type: 'BAR', payload: 42 };
    const actionResult2 = { type: 'BAR', payload: 43 };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: actionBarFn
        },
        process() {
          return Rx.Observable.create(obs => {
            obs.next(42);
            obs.next(43);
            obs.complete();
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches two actions of BAR with 42, 43 }', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionResult2);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 42 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 43 },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true failType=fn return error obs 32', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });
    const actionResult = { type: 'BAZ', payload: 32, error: true };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          failType: actionBazFn
        },
        process() {
          return Rx.Observable.create(obs => obs.error(32));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: 32, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAZ', payload: 32, error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true ST=fn FT=fn return obs 42 43 error', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });

    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: actionBarFn,
          failType: actionBazFn
        },
        process() {
          return Rx.Observable.create(obs => {
            obs.next(42);
            obs.next(43);
            obs.error(32);
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches 2 BAR actions and a BAZ action', () => {
      expect(dispatch.calls.length).toBe(3);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'BAR',
        payload: 42
      });
      expect(dispatch.calls[1].arguments[0]).toEqual({
        type: 'BAR',
        payload: 43
      });
      expect(dispatch.calls[2].arguments[0]).toEqual({
        type: 'BAZ',
        payload: 32,
        error: true
      });
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 42 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 43 },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAZ', payload: 32, error: true },
          op: 'dispatch' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

  describe('[logicA] process dispatchReturn:true ST=fn FT=fn return obs null', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });

    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: actionBarFn,
          failType: actionBazFn
        },
        process() {
          return Rx.Observable.create(obs => {
            obs.next(null);
            obs.complete();
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionFoo);
      mw.whenComplete(done);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: null }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'BAR',
        payload: null
      });
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        {
          action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next'
        },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        {
          action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: null },
          op: 'dispatch'
        },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

  });

});

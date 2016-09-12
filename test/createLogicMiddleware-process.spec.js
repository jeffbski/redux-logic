import Rx from 'rxjs';
import expect from 'expect';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware-process', () => {
  describe('[logicA] process dispatch()', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy().andCall(() => done());
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches nothing', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('[logicA] process dispatch(x)', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    let dispatchReturnValue;
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatchReturnValue = dispatch(actionBar);
        }
      });
      mw = createLogicMiddleware([logicA]);
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
  });

  describe('[logicA] process throws error without type', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: 'FOO',
        process() {
          const err = new Error('my error');
          throw err;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process throws error with type', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: 'FOO',
        process() {
          const err = new Error('my error');
          err.type = 'BAR_ERROR';
          throw err;
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches erroredObject', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('BAR_ERROR');
    });
  });

  describe('[logicA] process runtime error', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatch(x, { allowMore: true }) dispatch(y)', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) {
          done();
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatch(x, { allowMore: true }) dispatch()', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 1) {
          done();
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
  });

  describe('[logicA] process dispatch(obs)', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) {
          done();
        }
      }
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch(Rx.Observable.of(actionBar, actionCat));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatch(obs, { allowMore: true }) dispatch()', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) {
          done();
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatch(obs, { allowMore: true }) dispatch(x)', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    const actionCat = { type: 'CAT', a: 1 };
    const actionDog = { type: 'DOG', a: 1 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 3) {
          done();
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatch(obs, AM) dispatch(obs, AM) dispatch()', () => {
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
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 4) {
          done();
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatch(obs, AM) dispatch(obs, AM) dispatch(x)', () => {
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
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 5) {
          done();
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process successType=BAR dispatch(42)', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', payload: 42 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: 42 }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });
  });

  describe('[logicA] process successType=BarFn dispatch(42)', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBarFn(42)', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBarFn(42));
    });
  });

  describe('[logicA] process failType=BAZ dispatch(error)', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process failType=BazFn dispatch(error)', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process failType=BAZ throw error', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process failType=BazFn throw error', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatchReturn:true return undefined', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process() {
          setTimeout(() => done(), 0);
          return; // undefined
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches nothing', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('[logicA] process dispatchReturn:true return { type: BAR }', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });
  });

  describe('[logicA] process dispatchReturn:true return error without type', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatchReturn:true return error with type', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches erroredObject', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0].type).toBe('BAR_ERROR');
    });
  });

  describe('[logicA] process dispatchReturn:true return promise', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });
  });

  describe('[logicA] process dispatchReturn:true return promise undefined', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process({ cancelled$ }) {
          cancelled$.subscribe({ complete: done });
          return new Promise(resolve => resolve(undefined));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('does not dispatch', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('[logicA] process dispatchReturn:true return rejecting promise', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', error: true };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });
  });

  describe('[logicA] process dispatchReturn:true return rejecting promise undefined', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process({ cancelled$ }) {
          cancelled$.subscribe({ complete: done });
          return new Promise((resolve, reject) => reject(undefined));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('does not dispatch', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('[logicA] process dispatchReturn:true return obs', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });
  });

  describe('[logicA] process dispatchReturn:true return obs undefined', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process({ cancelled$ }) {
          cancelled$.subscribe({ complete: done });
          return Rx.Observable.create(obs => {
            obs.next(undefined);
            obs.complete();
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('does not dispatch', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('[logicA] process dispatchReturn:true return error obs', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', error: true };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });
  });

  describe('[logicA] process dispatchReturn:true return error obs undefined', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true
        },
        process({ cancelled$ }) {
          cancelled$.subscribe({ complete: done });
          return Rx.Observable.create(obs => obs.error(undefined));
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('does not dispatch', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  // successType and failType string type variants

  describe('[logicA] process dispatchReturn:true successType return undefined', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: 'BAR'
        },
        process() {
          setTimeout(() => done(), 0);
          return; // undefined
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches nothing', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('[logicA] process dispatchReturn:true successType=BAR return 42', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionResult = { type: 'BAR', payload: 42 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: 42 }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });
  });

  describe('[logicA] process dispatchReturn:true failType return error', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatchReturn:true successType=BAR return promise 42', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatchReturn:true failType return rejecting promise 32', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionResult = { type: 'BAZ', payload: 32, error: true };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: 32, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });
  });

  describe('[logicA] process dispatchReturn:true successType return obs 42, 43', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionResult = { type: 'BAR', payload: 42 };
    const actionResult2 = { type: 'BAR', payload: 43 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: 'BAR'
        },
        process({ cancelled$ }) {
          cancelled$.subscribe({ complete: done });
          return Rx.Observable.create(obs => {
            obs.next(42);
            obs.next(43);
            obs.complete();
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatchReturn:true failType return error obs 32', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionResult = { type: 'BAZ', payload: 32, error: true };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: 32, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });
  });

  // successType and failType action creator fn variants

  describe('[logicA] process dispatchReturn:true successType=fn return undefined', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: actionBarFn
        },
        process() {
          setTimeout(() => done(), 0);
          return; // undefined
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches nothing', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('[logicA] process dispatchReturn:true successType=fn return 42', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    const actionResult = { type: 'BAR', payload: 42 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAR, payload: 42 }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });
  });

  describe('[logicA] process dispatchReturn:true failType=fn return error', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });

    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatchReturn:true successType=fn return promise 42', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatchReturn:true failType=fn return rejecting promise 32', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });
    const actionResult = { type: 'BAZ', payload: 32, error: true };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: 32, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });
  });

  describe('[logicA] process dispatchReturn:true successType=fn return obs 42, 43', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    const actionResult = { type: 'BAR', payload: 42 };
    const actionResult2 = { type: 'BAR', payload: 43 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: actionBarFn
        },
        process({ cancelled$ }) {
          cancelled$.subscribe({ complete: done });
          return Rx.Observable.create(obs => {
            obs.next(42);
            obs.next(43);
            obs.complete();
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
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
  });

  describe('[logicA] process dispatchReturn:true failType=fn return error obs 32', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });
    const actionResult = { type: 'BAZ', payload: 32, error: true };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
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
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches { type: BAZ, payload: 32, error: true }', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionResult);
    });
  });

  describe('[logicA] process dispatchReturn:true ST=fn FT=fn return obs 42 43 error', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBarFn = x => ({ type: 'BAR', payload: x });
    const actionBazFn = x => ({ type: 'BAZ', payload: x, error: true });

    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        processOptions: {
          dispatchReturn: true,
          successType: actionBarFn,
          failType: actionBazFn
        },
        process({ cancelled$ }) {
          cancelled$.subscribe({ complete: done });
          return Rx.Observable.create(obs => {
            obs.next(42);
            obs.next(43);
            obs.error(32);
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
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
  });

});

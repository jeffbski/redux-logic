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
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch(actionBar);
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

  describe('[logicA] process dispatch(x, true) dispatch(y)', () => {
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

  describe('[logicA] process dispatch(x, true) dispatch()', () => {
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

  describe('[logicA] process dispatch(obs, true) dispatch()', () => {
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

  describe('[logicA] process dispatch(obs, true) dispatch(x)', () => {
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

  describe('[logicA] process dispatch(obs, true) dispatch(obs, true) dispatch()', () => {
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

  describe('[logicA] process dispatch(obs, true) dispatch(obs, true) dispatch(x)', () => {
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
});

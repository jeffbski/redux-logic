import Rx from 'rxjs';
import expect from 'expect-legacy';
import { createLogic, createLogicMiddleware } from '../src/index';

const actionFoo = { type: 'FOO' };

function createAndGatherDeps(origState, origDeps, cb) {
  let valState;
  let valDeps;
  let valCtx;
  let procDeps;
  const getState = () => origState;
  const next = expect.createSpy();
  const dispatch = expect.createSpy().andCall(finish);
  function finish() {
    cb({
      valState,
      valDeps,
      valCtx,
      procDeps
    });
  }
  const logicA = createLogic({
    type: '*',
    validate(deps, allow /* , reject */) {
      valState = deps.getState();
      valDeps = {
        ...deps
      };
      valCtx = { ...deps.ctx };
      deps.ctx.data = ['v']; // eslint-disable-line no-param-reassign
      allow(deps.action);
    },
    process(deps, dispatch) {
      procDeps = {
        ...deps
      };
      dispatch({ type: 'BAR' });
    }
  });
  const mw = createLogicMiddleware([logicA], origDeps);
  const storeFn = mw({ getState, dispatch })(next);
  storeFn(actionFoo);
}

describe('createLogicMiddleware-deps', () => {
  describe('no deps passed to createLogicMiddleware', () => {
    let allDeps;
    const origState = { a: 1 };
    const origDeps = undefined;
    beforeEach((done) => {
      createAndGatherDeps(origState, origDeps, resultDeps => {
        allDeps = resultDeps;
        done();
      });
    });

    it('validate/transform deps should have getState, action, cancelled$, ctx', () => {
      const { valState } = allDeps;
      const { action, cancelled$, ctx } = allDeps.valDeps;
      const valCtx = allDeps.valCtx;
      expect(Object.keys(allDeps.valDeps).sort())
        .toEqual(['action', 'cancelled$', 'ctx', 'getState']);
      expect(valState).toEqual(origState);
      expect(action).toEqual(actionFoo);
      expect(cancelled$).toExist();
      expect(ctx).toExist();
      expect(valCtx).toEqual({}); // check ctx before trans/proc
    });

    it('process deps should have getState, action, cancelled$, ctx', () => {
      const { action, cancelled$, ctx } = allDeps.procDeps;
      expect(Object.keys(allDeps.procDeps).sort())
        .toEqual(['action', 'cancelled$', 'ctx', 'getState']);
      expect(action).toEqual(actionFoo);
      expect(cancelled$).toExist();
      expect(ctx).toEqual({ data: ['v'] }); // updated in validate
    });
  });

  describe('deps={ y:42, z: \'hello\'} passed to createLogicMiddleware', () => {
    let allDeps;
    const origState = { a: 1 };
    const origDeps = { y: 42, z: 'hello' };
    beforeEach((done) => {
      createAndGatherDeps(origState, origDeps, resultDeps => {
        allDeps = resultDeps;
        done();
      });
    });

    it('validate deps should have getState, action, cancelled$, ctx, y, z', () => {
      const { valState } = allDeps;
      const { action, cancelled$, ctx, y, z } = allDeps.valDeps;
      const valCtx = allDeps.valCtx;
      expect(Object.keys(allDeps.valDeps).sort())
        .toEqual(['action', 'cancelled$', 'ctx', 'getState', 'y', 'z']);
      expect(valState).toEqual(origState);
      expect(action).toEqual(actionFoo);
      expect(cancelled$).toExist();
      expect(ctx).toExist();
      expect(valCtx).toEqual({}); // check ctx before trans/proc
      expect(y).toBe(42);
      expect(z).toBe('hello');
    });

    it('process deps should have getState, action, cancelled$, ctx, y, z', () => {
      const { action, cancelled$, ctx, y, z } = allDeps.procDeps;
      expect(Object.keys(allDeps.procDeps).sort())
        .toEqual(['action', 'cancelled$', 'ctx', 'getState', 'y', 'z']);
      expect(action).toEqual(actionFoo);
      expect(cancelled$).toExist();
      expect(ctx).toEqual({ data: ['v'] }); // updated in validate
      expect(y).toBe(42);
      expect(z).toBe('hello');
    });
  });

  describe('RW ctx object is passed between execution hooks', () => {
    it('should allow read/write in the hooks', done => {
      const getState = () => {};
      const origDeps = undefined;
      const next = expect.createSpy();
      const dispatch = expect.createSpy().andCall(() => done());
      const logicA = createLogic({
        type: '*',
        validate({ action, ctx }, allow /* , reject */) {
          expect(ctx).toEqual({});
          ctx.data = ['v']; // eslint-disable-line no-param-reassign
          allow(action);
        },
        process({ ctx }, dispatch) {
          expect(ctx).toEqual({ data: ['v'] });
          dispatch({ type: 'BAR' });
        }
      });
      const mw = createLogicMiddleware([logicA], origDeps);
      const storeFn = mw({ getState, dispatch })(next);
      storeFn(actionFoo);
    });
  });

  describe('cancelled$', () => {
    it('should indicate cancellation', done => {
      const getState = () => {};
      const origDeps = undefined;
      const next = expect.createSpy();
      const dispatch = expect.createSpy();
      const logicA = createLogic({
        type: 'FOO',
        cancelType: 'FOO_CANCEL',
        process({ cancelled$ }, dispatch) {
          cancelled$.subscribe({
            next: () => done() // should be cancelled
          });
          setTimeout(() => {
            dispatch({ type: 'BAR' });
          }, 30);
          fireNextAction();
        }
      });
      const mw = createLogicMiddleware([logicA], origDeps);
      const storeFn = mw({ getState, dispatch })(next);
      storeFn(actionFoo);
      // next action will be triggered once logicA is ready
      function fireNextAction() {
        storeFn({ type: 'FOO_CANCEL' });
      }
    });

    it('should indicate completion even if not cancelled', done => {
      const getState = () => {};
      const origDeps = undefined;
      const next = expect.createSpy();
      const dispatch = expect.createSpy();
      const logicA = createLogic({
        type: 'FOO',
        cancelType: 'FOO_CANCEL',
        process({ cancelled$ }, dispatch) {
          cancelled$.subscribe({
            complete: () => done() // should be completed regardless
          });
          setTimeout(() => {
            dispatch({ type: 'BAR' });
          }, 0);
        }
      });
      const mw = createLogicMiddleware([logicA], origDeps);
      const storeFn = mw({ getState, dispatch })(next);
      storeFn(actionFoo);
    });

    it('should indicate completion when error occurred', done => {
      const getState = () => {};
      const origDeps = undefined;
      const next = expect.createSpy();
      const dispatch = expect.createSpy();
      const logicA = createLogic({
        type: 'FOO',
        cancelType: 'FOO_CANCEL',
        // eslint-disable-next-line no-unused-vars
        process({ cancelled$ }, dispatch) {
          cancelled$.subscribe({
            complete: () => done() // should be completed regardless
          });

          throw new Error('bar');
        }
      });
      const mw = createLogicMiddleware([logicA], origDeps);
      const storeFn = mw({ getState, dispatch })(next);
      storeFn(actionFoo);
    });

  });

  describe('cancelled$ dispatch(obs)', () => {
    it('should not dispatch after cancelled', done => {
      const getState = () => {};
      const origDeps = undefined;
      const next = expect.createSpy();
      let cancelFired = false;
      const dispatch = expect.createSpy().andCall(cb);
      function cb() {
        if (cancelFired) {
          done(new Error('dispatched after cancelled'));
        }
      }
      const logicA = createLogic({
        type: 'FOO',
        cancelType: 'FOO_CANCEL',
        process({ cancelled$ }, dispatch) {
          cancelled$.subscribe({
            next: () => {
              cancelFired = true;
              // let's delay to see if any dispatches occur
              setTimeout(() => {
                done();
              }, 10);
            }
          });
          const ob$ = Rx.Observable.interval(1)
                .map(x => ({ type: 'BAR', payload: x }));
          dispatch(ob$);

          fireNextAction(); // manually triggering to get timing right
        }
      });
      const mw = createLogicMiddleware([logicA], origDeps);
      const storeFn = mw({ getState, dispatch })(next);
      storeFn(actionFoo);
      // called in logicA to get timing right
      function fireNextAction() {
        storeFn({ type: 'FOO_CANCEL' });
      }
    });
  });
});

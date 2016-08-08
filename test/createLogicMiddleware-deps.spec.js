import expect from 'expect';
import { createLogic, createLogicMiddleware } from '../src/index';

const actionFoo = { type: 'FOO' };

function createAndGatherDeps(origState, origDeps, cb) {
  let valState;
  let valDeps;
  let valCtx;
  let transDeps;
  let transCtxData;
  let procDeps;
  const getState = () => origState;
  const next = expect.createSpy();
  const dispatch = expect.createSpy().andCall(finish);
  function finish() {
    cb({
      valState,
      valDeps,
      valCtx,
      transDeps,
      transCtxData,
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
    transform(deps, next) {
      transDeps = {
        ...deps
      };
      transCtxData = deps.ctx.data;
      deps.ctx.data = [...deps.ctx.data, 't']; // eslint-disable-line no-param-reassign
      next(deps.action);
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

    it('validate deps should have getState, action, cancelled$, ctx', () => {
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

    it('transform deps should have getState, action, cancelled$, ctx', () => {
      const { action, cancelled$, ctx } = allDeps.transDeps;
      const transCtxData = allDeps.transCtxData;
      expect(Object.keys(allDeps.transDeps).sort())
        .toEqual(['action', 'cancelled$', 'ctx', 'getState']);
      expect(action).toEqual(actionFoo);
      expect(cancelled$).toExist();
      expect(ctx).toExist();
      expect(transCtxData).toEqual(['v']); // check ctx in trans
    });

    it('process deps should have getState, action, cancelled$, ctx', () => {
      const { action, cancelled$, ctx } = allDeps.procDeps;
      expect(Object.keys(allDeps.procDeps).sort())
        .toEqual(['action', 'cancelled$', 'ctx', 'getState']);
      expect(action).toEqual(actionFoo);
      expect(cancelled$).toExist();
      expect(ctx).toEqual({ data: ['v', 't'] }); // updated in val+trans
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

    it('transform deps should have getState, action, cancelled$, ctx, y, z', () => {
      const { action, cancelled$, ctx, y, z } = allDeps.transDeps;
      const transCtxData = allDeps.transCtxData;
      expect(Object.keys(allDeps.transDeps).sort())
        .toEqual(['action', 'cancelled$', 'ctx', 'getState', 'y', 'z']);
      expect(action).toEqual(actionFoo);
      expect(cancelled$).toExist();
      expect(ctx).toExist();
      expect(transCtxData).toEqual(['v']); // check ctx in trans
      expect(y).toBe(42);
      expect(z).toBe('hello');
    });

    it('process deps should have getState, action, cancelled$, ctx, y, z', () => {
      const { action, cancelled$, ctx, y, z } = allDeps.procDeps;
      expect(Object.keys(allDeps.procDeps).sort())
        .toEqual(['action', 'cancelled$', 'ctx', 'getState', 'y', 'z']);
      expect(action).toEqual(actionFoo);
      expect(cancelled$).toExist();
      expect(ctx).toEqual({ data: ['v', 't'] }); // updated in val+trans
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
        transform({ action, ctx }, next) {
          expect(ctx).toEqual({ data: ['v'] });
          ctx.data = [...ctx.data, 't']; // eslint-disable-line no-param-reassign
          next(action);
        },
        process({ ctx }, dispatch) {
          expect(ctx).toEqual({ data: ['v', 't'] });
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
        type: '*',
        cancelType: 'FOO_CANCEL',
        process({ cancelled$ }, dispatch) {
          cancelled$.subscribe({
            next: () => done() // should be cancelled
          });
          setTimeout(() => {
            dispatch({ type: 'BAR' });
          }, 10);
        }
      });
      const mw = createLogicMiddleware([logicA], origDeps);
      const storeFn = mw({ getState, dispatch })(next);
      storeFn(actionFoo);
      setTimeout(() => {
        storeFn({ type: 'FOO_CANCEL' });
      }, 0);
    });

    it('should indicate completion even if not cancelled', done => {
      const getState = () => {};
      const origDeps = undefined;
      const next = expect.createSpy();
      const dispatch = expect.createSpy();
      const logicA = createLogic({
        type: '*',
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
  });

});

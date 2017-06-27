import expect from 'expect';
import { createStore, applyMiddleware } from 'redux';
import { createLogic, createLogicMiddleware } from '../src/index';


describe('createLogicMiddleware-integration', () => {

  describe('throw error in reducer from dispatch', () => {
    const consoleErrors = [];

    // eslint-disable-next-line no-console
    const origConsoleError = console.error;
    beforeEach(() => {
      // eslint-disable-next-line no-console
      console.error = x => consoleErrors.push(x);
      consoleErrors.length = 0;
    });

    after(() => {
      // eslint-disable-next-line no-console
      console.error = origConsoleError;
    });

    let monArr = [];
    beforeEach((done) => {
      monArr = [];
      const initialState = {};

      function reducer(state, action) {
        switch (action.type) {
          case 'BAD':
            throw new Error('something bad happened');
          default:
            return state;
        }
      }

      const processLogic = createLogic({
        type: 'FOO',
        process({ getState, action }, dispatch, done) {
          dispatch({ type: 'BAD' }); // throws error
          done();
        }
      });

      const logicMiddleware = createLogicMiddleware([processLogic]);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.dispatch({ type: 'FOO' });
      // we could just call done() here since everything is sync
      // but whenComplete is always the safe thing to do
      logicMiddleware.whenComplete(done);
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
          dispAction: { type: 'BAD' },
          op: 'dispatch' },
        { action: { type: 'BAD' }, op: 'top' },
        { action: { type: 'BAD' },
          err: 'something bad happened',
          op: 'nextError' },
        { nextAction: { type: 'BAD' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('console.error should have logged the error', () => {
      expect(consoleErrors.length).toBe(1);
      expect(consoleErrors[0]).toContain('reducer');
    });
  });

  describe('throw error in reducer from mw next call', () => {
    // eslint-disable-next-line no-console
    const origConsoleError = console.error;
    const consoleErrors = [];
    beforeEach(() => {
      // eslint-disable-next-line no-console
      console.error = x => consoleErrors.push(x);
      consoleErrors.length = 0;
    });

    after(() => {
      // eslint-disable-next-line no-console
      console.error = origConsoleError;
    });

    let monArr = [];
    beforeEach((done) => {
      monArr = [];
      const initialState = {};

      function reducer(state, action) {
        switch (action.type) {
        case 'BAD':
          throw new Error('another bad thing');
        default:
          return state;
        }
      }

      const processLogic = createLogic({
        type: 'BAD',
      });

      const logicMiddleware = createLogicMiddleware([processLogic]);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
        applyMiddleware(logicMiddleware));
      store.dispatch({ type: 'BAD' });
      // we could just call done() here since everything is sync
      // but whenComplete is always the safe thing to do
      logicMiddleware.whenComplete(done);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'BAD' }, op: 'top' },
        { action: { type: 'BAD' }, name: 'L(BAD)-0', op: 'begin' },
        { action: { type: 'BAD' },
          nextAction: { type: 'BAD' },
          name: 'L(BAD)-0',
          shouldProcess: true,
          op: 'next' },
        { action: { type: 'BAD' },
          err: 'another bad thing',
          op: 'nextError' },
        { nextAction: { type: 'BAD' }, op: 'bottom' },
        { action: { type: 'BAD' }, name: 'L(BAD)-0', op: 'end' }
      ]);
    });

    it('console.error should have logged the error', () => {
      expect(consoleErrors.length).toBe(1);
      expect(consoleErrors[0]).toContain('reducer');
    });
  });


  // throw string
  describe('throw string in reducer', () => {
    // eslint-disable-next-line no-console
    const origConsoleError = console.error;
    const consoleErrors = [];
    beforeEach(() => {
      // eslint-disable-next-line no-console
      console.error = x => consoleErrors.push(x);
      consoleErrors.length = 0;
    });

    after(() => {
      // eslint-disable-next-line no-console
      console.error = origConsoleError;
    });

    let monArr = [];
    beforeEach((done) => {
      monArr = [];
      const initialState = {};

      function reducer(state, action) {
        switch (action.type) {
          case 'BAD':
            // eslint-disable-next-line no-throw-literal
            throw 'you should throw an error instead';
          default:
            return state;
        }
      }

      const processLogic = createLogic({
        type: 'FOO',
        process({ getState, action }, dispatch, done) {
          dispatch({ type: 'BAD' }); // throws error
          done();
        }
      });

      const logicMiddleware = createLogicMiddleware([processLogic]);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.dispatch({ type: 'FOO' });
      // we could just call done() here since everything is sync
      // but whenComplete is always the safe thing to do
      logicMiddleware.whenComplete(done);
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
          dispAction: { type: 'BAD' },
          op: 'dispatch' },
        { action: { type: 'BAD' }, op: 'top' },
        { action: { type: 'BAD' },
          err: 'you should throw an error instead',
          op: 'nextError' },
        { nextAction: { type: 'BAD' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('console.error should have logged the error', () => {
      expect(consoleErrors.length).toBe(1);
      expect(consoleErrors[0]).toContain('reducer');
    });
  });

  describe('rapid call with single logic', () => {
    let storeUpdates;
    let monArr = [];
    beforeEach((done) => {
      monArr = [];
      storeUpdates = [];
      const initialState = { count: 1 };

      function reducer(state, action) {
        switch (action.type) {
        case 'DEC':
          return {
            ...state,
            count: state.count - 1
          };
        default:
          return state;
        }
      }

      const validateDecLogic = createLogic({
        type: 'DEC',
        validate({ getState, action }, allow, reject) {
          if (getState().count > 0) {
            allow(action);
          } else {
            reject({ type: 'NOOP' });
          }
        }
      });

      const logicMiddleware = createLogicMiddleware([validateDecLogic]);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.subscribe(() => {
        storeUpdates.push({
          ...store.getState()
        });
        if (storeUpdates.length === 2) {
          // done();
          // using whenComplete to trigger done
        }
      });

      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      // we could just call done() here since everything is sync
      // but whenComplete is always the safe thing to do
      logicMiddleware.whenComplete(done);
    });

    it('should only decrement once', () => {
      expect(storeUpdates[0].count).toBe(0);
      expect(storeUpdates[1].count).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          nextAction: { type: 'DEC' },
          name: 'L(DEC)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'DEC' }, op: 'bottom' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' }
      ]);
    });
  });

  describe('rapid call with 2 logic', () => {
    let storeUpdates;
    let monArr = [];
    beforeEach((done) => {
      monArr = [];
      storeUpdates = [];
      const initialState = { count: 1 };

      function reducer(state, action) {
        switch (action.type) {
        case 'DEC':
          return {
            ...state,
            count: state.count - 1
          };
        default:
          return state;
        }
      }

      const validateDecLogic = createLogic({
        type: 'DEC',
        validate({ getState, action }, allow, reject) {
          if (getState().count > 0) {
            allow(action);
          } else {
            reject({ type: 'NOOP' });
          }
        }
      });

      const anotherLogic = createLogic({
        type: '*',
        transform({ action }, next) {
          next(action);
        }
      });


      const arrLogic = [
        validateDecLogic,
        anotherLogic
      ];
      const logicMiddleware = createLogicMiddleware(arrLogic);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.subscribe(() => {
        storeUpdates.push({
          ...store.getState()
        });
        if (storeUpdates.length === 4) {
          // done();
          // using whenComplete to trigger done
        }
      });

      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      logicMiddleware.whenComplete(done);
    });

    it('should only decrement once', () => {
      expect(storeUpdates[0].count).toBe(0);
      expect(storeUpdates[1].count).toBe(0);
      expect(storeUpdates[2].count).toBe(0);
      expect(storeUpdates[3].count).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          nextAction: { type: 'DEC' },
          name: 'L(DEC)-0',
          shouldProcess: true,
          op: 'next' },
        { action: { type: 'DEC' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'DEC' },
          nextAction: { type: 'DEC' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'DEC' }, op: 'bottom' },
        { action: { type: 'DEC' }, name: 'L(*)-1', op: 'end' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'NOOP' },
          nextAction: { type: 'NOOP' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'end' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'NOOP' },
          nextAction: { type: 'NOOP' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'end' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'NOOP' },
          nextAction: { type: 'NOOP' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'end' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' }
      ]);
    });

  });

});

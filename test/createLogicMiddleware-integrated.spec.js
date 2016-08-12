import expect from 'expect';
import { createStore, applyMiddleware } from 'redux';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware-integration', () => {
  describe('rapid call with single logic', () => {
    let storeUpdates;
    beforeEach((done) => {
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

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.subscribe(() => {
        storeUpdates.push({
          ...store.getState()
        });
        if (storeUpdates.length === 2) { done(); }
      });

      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
    });

    it('should only decrement once', () => {
      expect(storeUpdates[0].count).toBe(0);
      expect(storeUpdates[1].count).toBe(0);
    });
  });

  describe('rapid call with 2 logic', () => {
    let storeUpdates;
    beforeEach((done) => {
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

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.subscribe(() => {
        storeUpdates.push({
          ...store.getState()
        });
        if (storeUpdates.length === 4) { done(); }
      });

      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
    });

    it('should only decrement once', () => {
      expect(storeUpdates[0].count).toBe(0);
      expect(storeUpdates[1].count).toBe(0);
      expect(storeUpdates[2].count).toBe(0);
      expect(storeUpdates[3].count).toBe(0);
    });
  });

  describe('rapid call with 2 logic valid+trans', () => {
    let storeUpdates;
    beforeEach((done) => {
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
        },
        transform({ action }, next) {
          next(action);
        }
      });

      const anotherLogic = createLogic({
        type: '*',
        validate({ action }, allow /* , reject */) {
          allow(action);
        },
        transform({ action }, next) {
          next(action);
        }
      });

      const arrLogic = [
        validateDecLogic,
        anotherLogic
      ];
      const logicMiddleware = createLogicMiddleware(arrLogic);

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.subscribe(() => {
        storeUpdates.push({
          ...store.getState()
        });
        if (storeUpdates.length === 4) { done(); }
      });

      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
    });

    it('should only decrement once', () => {
      expect(storeUpdates[0].count).toBe(0);
      expect(storeUpdates[1].count).toBe(0);
      expect(storeUpdates[2].count).toBe(0);
      expect(storeUpdates[3].count).toBe(0);
    });
  });

});

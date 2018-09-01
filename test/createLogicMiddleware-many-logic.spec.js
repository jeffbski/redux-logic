import expect from 'expect-legacy';
import range from 'lodash/fp/range';
import { applyMiddleware, createStore } from 'redux';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware-many-logic', () => {
  describe('with validate and process', () => {
    const NUM_LOGICS = 200;
    let mw;
    let store;

    beforeEach(() => {
      const arrLogic = range(0, NUM_LOGICS).map(() => createLogic({
        type: 'foo',
        validate({ action }, allow) {
          allow({
            ...action,
            validates: action.validates + 1
          });
        },
        process({ action }, dispatch, done) {
          dispatch({ type: 'foo-success' });
          done();
        }
      }));
      mw = createLogicMiddleware(arrLogic);
      const reducer = (state = { validates: 0, processes: 0 }, action) => {
        switch (action.type) {
        case 'foo' :
          return {
            ...state,
            validates: state.validates + action.validates
          };
        case 'foo-success' :
          return {
            ...state,
            processes: state.processes + 1
          };
        default:
          return state;
        }
      };
      store = createStore(reducer, undefined, applyMiddleware(mw));
      store.dispatch({ type: 'foo', validates: 0 });
    });

    it('expect state to be updated', () => {
      expect(store.getState()).toEqual({ validates: NUM_LOGICS, processes: NUM_LOGICS });
    });
  });

  describe('with validate', () => {
    const NUM_LOGICS = 200;
    let mw;
    let store;

    beforeEach(() => {
      const arrLogic = range(0, NUM_LOGICS).map(() => createLogic({
        type: 'foo',
        validate({ action }, allow) {
          allow({
            ...action,
            validates: action.validates + 1
          });
        }
      }));
      mw = createLogicMiddleware(arrLogic);
      const reducer = (state = { validates: 0, processes: 0 }, action) => {
        switch (action.type) {
        case 'foo' :
          return {
            ...state,
            validates: state.validates + action.validates
          };
        default:
          return state;
        }
      };
      store = createStore(reducer, undefined, applyMiddleware(mw));
      store.dispatch({ type: 'foo', validates: 0 });
    });

    it('expect state to be updated', () => {
      expect(store.getState()).toEqual({ validates: NUM_LOGICS, processes: 0 });
    });
  });

  describe('with process', () => {
    const NUM_LOGICS = 200;
    let mw;
    let store;

    beforeEach(() => {
      const arrLogic = range(0, NUM_LOGICS).map(() => createLogic({
        type: 'foo',
        process({ action }, dispatch, done) {
          dispatch({ type: 'foo-success' });
          done();
        }
      }));
      mw = createLogicMiddleware(arrLogic);
      const reducer = (state = { validates: 0, processes: 0 }, action) => {
        switch (action.type) {
        case 'foo' :
          return {
            ...state,
            validates: state.validates + action.validates
          };
        case 'foo-success' :
          return {
            ...state,
            processes: state.processes + 1
          };
        default:
          return state;
        }
      };
      store = createStore(reducer, undefined, applyMiddleware(mw));
      store.dispatch({ type: 'foo', validates: 0 });
    });

    it('expect state to be updated', () => {
      expect(store.getState()).toEqual({ validates: 0, processes: NUM_LOGICS });
    });
  });

});

import expect from 'expect-legacy';
import range from 'lodash/fp/range';
import { applyMiddleware, createStore } from 'redux';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware-many-logic', () => {
  describe('with validate and process', () => {
    const NUM_LOGICS = 170; // 230 with cancel optimization
    let mw;
    let store;

    beforeEach(() => {
      const arrLogic = range(0, NUM_LOGICS).map(() =>
        createLogic({
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
        })
      );
      mw = createLogicMiddleware(arrLogic);
      const reducer = (state = { validates: 0, processes: 0 }, action) => {
        switch (action.type) {
          case 'foo':
            return {
              ...state,
              validates: state.validates + action.validates
            };
          case 'foo-success':
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
    const NUM_LOGICS = 220; // 370 with cancel optimization
    let mw;
    let store;

    beforeEach(() => {
      const arrLogic = range(0, NUM_LOGICS).map(() =>
        createLogic({
          type: 'foo',
          validate({ action }, allow) {
            allow({
              ...action,
              validates: action.validates + 1
            });
          }
        })
      );
      mw = createLogicMiddleware(arrLogic);
      const reducer = (state = { validates: 0, processes: 0 }, action) => {
        switch (action.type) {
          case 'foo':
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
    // single-test 240, with mergeMapOrTap 450
    // full suite 350, with mergeMapOrTap 540
    const NUM_LOGICS = 600; // 350 with optimizations
    let mw1;
    let mw2;
    let store;

    beforeEach(async () => {
      const arrLogic = range(0, NUM_LOGICS).map(() =>
        createLogic({
          type: 'foo',
          process({ action }, dispatch, done) {
            dispatch({ type: 'foo-success' });
            done();
          }
        })
      );
      mw1 = createLogicMiddleware(arrLogic.slice(0, 300));
      mw2 = createLogicMiddleware(arrLogic.slice(300));
      const reducer = (state = { validates: 0, processes: 0 }, action) => {
        switch (action.type) {
          case 'foo':
            return {
              ...state,
              validates: state.validates + action.validates
            };
          case 'foo-success':
            return {
              ...state,
              processes: state.processes + 1
            };
          default:
            return state;
        }
      };
      store = createStore(reducer, undefined, applyMiddleware(mw1, mw2));
      store.dispatch({ type: 'foo', validates: 0 });
      return Promise.all([mw1.whenComplete(), mw2.whenComplete()]);
    });

    it('expect state to be updated', () => {
      expect(store.getState()).toEqual({ validates: 0, processes: NUM_LOGICS });
    });
  });
});

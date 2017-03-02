import expect from 'expect';
import Rx from 'rxjs';
import { createLogic, createLogicMiddleware } from '../src/index';

const NODE_ENV = process.env.NODE_ENV;

describe('createLogic', () => {
  describe('createLogic()', () => {
    it('throws type is required error', () => {
      expect(() => {
        createLogic();
      }).toThrow(/type.*required/);
    });
  });

  describe('createLogic({})', () => {
    it('throws type is required error', () => {
      expect(() => {
        createLogic({});
      }).toThrow(/type.*required/);
    });
  });

  describe('warnTimeout', () => {
    it('defaults to 60000 ms', () => {
      const fooLogic = createLogic({
        type: '*'
      });
      expect(fooLogic.warnTimeout).toBe(60000);
    });

    it('can be set', () => {
      const fooLogic = createLogic({
        type: '*',
        warnTimeout: 120000 // 120,000ms == 2 minutes
      });
      expect(fooLogic.warnTimeout).toBe(120000);
    });

    it('errors if they try to set it as processOptions.warnTimeout', () => {
      function fn() {
        createLogic({
          type: '*',
          processOptions: {
            // this is invalid, warnTimeout is a top level option
            warnTimeout: 120000 // 120,000ms == 2 minutes
          }
        });
      }
      expect(fn).toThrow('warnTimeout is a top level createLogic option, not a processOptions option');
    });
  });

  describe('debounce', () => {
    let dispatch;
    beforeEach((done) => {
      const next = expect.createSpy();
      dispatch = expect.createSpy().andCall(check);
      function check(action) {
        // last dispatch should be slow: 3
        if (action.slow === 3) { done(); }
      }
      const logicA = createLogic({
        type: 'FOO',
        debounce: 40,
        process({ action }, dispatch) {
          setTimeout(() => {
            dispatch({
              ...action,
              type: 'BAR'
            });
          }, 100); // delay so we can use latest
        }
      });
      const mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      Rx.Observable.merge(
        // fast 0, 1, 2
        Rx.Observable.interval(10)
          .take(3)
          .map(x => ({ fast: x })),
        // slow 0, 1, 2, 3
        Rx.Observable.interval(60)
          .take(4)
          .delay(40)
          .map(x => ({ slow: x }))
      ).subscribe(x => {
        storeFn({
          ...x,
          type: 'FOO'
        });
      });
    });

    it('should debounce the fast calls', () => {
      expect(dispatch.calls.length).toBe(5);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'BAR',
        fast: 2
      });
    });
  });

  describe('debounce and latest', () => {
    let dispatch;
    beforeEach((done) => {
      const next = expect.createSpy();
      dispatch = expect.createSpy().andCall(check);
      function check(action) {
        // last dispatch should be slow: 3
        if (action.slow === 3) { done(); }
      }
      const logicA = createLogic({
        type: 'FOO',
        latest: true,
        debounce: 40,
        process({ action }, dispatch) {
          setTimeout(() => {
            dispatch({
              ...action,
              type: 'BAR'
            });
          }, 100); // delay so we can use latest
        }
      });
      const mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      Rx.Observable.merge(
        // fast 0, 1, 2
        Rx.Observable.interval(10)
          .take(3)
          .map(x => ({ fast: x })),
        // slow 0, 1, 2, 3
        Rx.Observable.interval(60)
          .take(4)
          .delay(40)
          .map(x => ({ slow: x }))
      ).subscribe(x => {
        storeFn({
          ...x,
          type: 'FOO'
        });
      });
    });

    it('should debounce and only use latest', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'BAR',
        slow: 3
      });
    });
  });

  describe('throttle', () => {
    let dispatch;
    beforeEach((done) => {
      const asyncProcessDelay = 100; // simulate slow service
      const next = expect.createSpy();
      dispatch = expect.createSpy();
      const logicA = createLogic({
        type: 'FOO',
        throttle: 40,
        process({ action }, dispatch) {
          setTimeout(() => {
            dispatch({
              ...action,
              type: 'BAR'
            });
          }, asyncProcessDelay); // delay so we can use latest
        }
      });
      const mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      Rx.Observable.merge(
        // fast 0, 1, 2
        Rx.Observable.interval(10)
          .take(3)
          .map(x => ({ fast: x })),
        // slow 0, 1, 2, 3
        Rx.Observable.interval(60)
          .take(4)
          .delay(40)
          .map(x => ({ slow: x }))
      ).subscribe({
        next: x => {
          storeFn({
            ...x,
            type: 'FOO'
          });
        },
        complete: () => {
          setTimeout(() => {
            done();
          }, asyncProcessDelay + 20); // add margin
        }
      });
    });

    it('should throttle', () => {
      expect(dispatch.calls.length)
        .toBeLessThan(7)
        .toBeGreaterThan(3); // margin for CI test env
    });
  });

  describe('throttle and latest', () => {
    let dispatch;
    beforeEach((done) => {
      const asyncProcessDelay = 100; // simulate slow service
      const next = expect.createSpy();
      dispatch = expect.createSpy();
      const logicA = createLogic({
        type: 'FOO',
        latest: true,
        throttle: 40,
        process({ action }, dispatch) {
          setTimeout(() => {
            dispatch({
              ...action,
              type: 'BAR'
            });
          }, asyncProcessDelay); // delay so we can use latest
        }
      });
      const mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      Rx.Observable.merge(
        // fast 0, 1, 2
        Rx.Observable.interval(10)
          .take(3)
          .map(x => ({ fast: x })),
        // slow 0, 1, 2, 3
        Rx.Observable.interval(60)
          .take(4)
          .delay(40)
          .map(x => ({ slow: x }))
      ).subscribe({
        next: x => {
          storeFn({
            ...x,
            type: 'FOO'
          });
        },
        complete: () => {
          setTimeout(() => {
            done();
          }, asyncProcessDelay + 20); // add margin
        }
      });
    });

    it('should throttle and use latest', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual({
        type: 'BAR',
        slow: 3
      });
    });
  });

  describe('debounce and throttle', () => {
    let dispatch;
    beforeEach((done) => {
      const asyncProcessDelay = 100; // simulate slow service
      const next = expect.createSpy();
      dispatch = expect.createSpy();
      const logicA = createLogic({
        type: 'FOO',
        debounce: 30,
        throttle: 80,
        process({ action }, dispatch) {
          setTimeout(() => {
            dispatch({
              ...action,
              type: 'BAR'
            });
          }, asyncProcessDelay); // delay so we can use latest
        }
      });
      const mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      Rx.Observable.merge(
        // fast 0, 1, 2
        Rx.Observable.interval(10)
          .take(3)
          .map(x => ({ fast: x })),
        // slow 0, 1, 2, 3
        Rx.Observable.interval(60)
          .take(4)
          .delay(40)
          .map(x => ({ slow: x }))
      ).subscribe({
        next: x => {
          storeFn({
            ...x,
            type: 'FOO'
          });
        },
        complete: () => {
          setTimeout(() => {
            done();
          }, asyncProcessDelay + 20); // add margin
        }
      });
    });

    it('should debounce and throttle', () => {
      expect(dispatch.calls.length)
        .toBeGreaterThan(1)
        .toBeLessThan(5); // allow margin for CI env
    });
  });

  describe('debounce, throttle, and latest', () => {
    let dispatch;
    beforeEach((done) => {
      const asyncProcessDelay = 100; // simulate slow service
      const next = expect.createSpy();
      dispatch = expect.createSpy();
      const logicA = createLogic({
        type: 'FOO',
        debounce: 30,
        throttle: 80,
        latest: true,
        process({ action }, dispatch) {
          setTimeout(() => {
            dispatch({
              ...action,
              type: 'BAR'
            });
          }, asyncProcessDelay); // delay so we can use latest
        }
      });
      const mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      Rx.Observable.merge(
        // fast 0, 1, 2
        Rx.Observable.interval(10)
          .take(3)
          .map(x => ({ fast: x })),
        // slow 0, 1, 2, 3
        Rx.Observable.interval(60)
          .take(4)
          .delay(40)
          .map(x => ({ slow: x }))
      ).subscribe({
        next: x => {
          storeFn({
            ...x,
            type: 'FOO'
          });
        },
        complete: () => {
          setTimeout(() => {
            done();
          }, asyncProcessDelay + 100); // add margin
        }
      });
    });

    it('should debounce, throttle, and use latest', () => {
      expect(dispatch.calls.length).toBe(1);
    });
  });

  describe('validate and transform', () => {
    it('throws cannot define both error', () => {
      expect(() => {
        createLogic({
          type: 'FOO',
          validate({ action }, allow /* , reject */) {
            allow(action);
          },
          transform({ action }, next /* , reject */) {
            next(action);
          }
        });
      }).toThrow('cannot define both');
    });
  });

  describe('name given fn', () => {
    it('converts name to fn.toString()', () => {
      const fn = () => {};
      fn.toString = () => 'myFn';
      const logic = createLogic({
        name: fn,
        type: 'FOO'
      });
      expect(logic.name).toBe('myFn');
    });
  });

  describe('type given fn', () => {
    it('converts type to fn.toString()', () => {
      const fn = () => {};
      fn.toString = () => 'myType';
      const logic = createLogic({
        type: fn
      });
      expect(logic.type).toBe('myType');
    });
  });

  describe('type given array of fns', () => {
    it('converts type to arr of fn.toString()', () => {
      const fn = () => {};
      fn.toString = () => 'myType';
      const fn2 = () => {};
      fn2.toString = () => 'myType2';
      const logic = createLogic({
        type: [fn, fn2]
      });
      expect(logic.type).toEqual(['myType', 'myType2']);
    });
  });

  describe('process fn sig no params', () => {
    let logic;
    beforeEach(() => {
      logic = createLogic({
        type: 'foo',
        process() { // eslint-disable-line no-unused-vars
        }
      });
    });
    it('defaults processOptions.dispatchReturn true', () => {
      expect(logic.processOptions.dispatchReturn).toBe(true);
    });
    it('defaults processOptions.dispatchMultiple undefined', () => {
      expect(logic.processOptions.dispatchMultiple).toBe(undefined);
    });
  });

  describe('process fn sig without dispatch nor done', () => {
    let logic;
    beforeEach(() => {
      logic = createLogic({
        type: 'foo',
        process(deps) { // eslint-disable-line no-unused-vars
        }
      });
    });
    it('defaults processOptions.dispatchReturn true', () => {
      expect(logic.processOptions.dispatchReturn).toBe(true);
    });
    it('defaults processOptions.dispatchMultiple undefined', () => {
      expect(logic.processOptions.dispatchMultiple).toBe(undefined);
    });
  });

  describe('process fn sig with dispatch but not done', () => {
    let logic;
    beforeEach(() => {
      logic = createLogic({
        type: 'foo',
        process(deps, dispatch) { // eslint-disable-line no-unused-vars
          dispatch();
        }
      });
    });
    it('defaults processOptions.dispatchReturn undefined', () => {
      expect(logic.processOptions.dispatchReturn).toBe(undefined);
    });
    it('defaults processOptions.dispatchMultiple undefined', () => {
      expect(logic.processOptions.dispatchMultiple).toBe(undefined);
    });
  });

  describe('process fn sig with dispatch and done', () => {
    let logic;
    beforeEach(() => {
      logic = createLogic({
        type: 'foo',
        process(deps, dispatch, done) { // eslint-disable-line no-unused-vars
          dispatch();
          done();
        }
      });
    });
    it('defaults processOptions.dispatchReturn undefined', () => {
      expect(logic.processOptions.dispatchReturn).toBe(undefined);
    });
    it('defaults processOptions.dispatchMultiple true', () => {
      expect(logic.processOptions.dispatchMultiple).toBe(true);
    });
  });

  describe('process fn sig with dispatch and done and extra', () => {
    let logic;
    beforeEach(() => {
      logic = createLogic({
        type: 'foo',
        process(deps, dispatch, done, extra) { // eslint-disable-line no-unused-vars
          dispatch();
          done();
        }
      });
    });
    it('defaults processOptions.dispatchReturn undefined', () => {
      expect(logic.processOptions.dispatchReturn).toBe(undefined);
    });
    it('defaults processOptions.dispatchMultiple true', () => {
      expect(logic.processOptions.dispatchMultiple).toBe(true);
    });
  });

  describe('unknown or misspelled option', () => {
    it('throws an error', () => {
      expect(() => {
        createLogic({ foo: true });
      }).toThrow('unknown or misspelled option');
    });
  });

  describe('unknown or misspelled processOption', () => {
    it('throws an error', () => {
      expect(() => {
        createLogic({
          type: 'FOO',
          processOptions: {
            wrongOption: 32
          }
        });
      }).toThrow('unknown or misspelled processOption(s)');
    });
  });

  describe('use of single-dispatch mode w/o dispatchMultiple or warnTimeout: 0', () => {
    let consoleErrorSpy;
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });

    if (NODE_ENV === 'production') {
      it('PROD should not have called console.error with warning', () => {
        expect(consoleErrorSpy.calls.length).toBe(0);
      });
    } else { // not production
      it('warn that single-dispatch mode is deprecated', () => {
        createLogic({
          type: '*',
          process(deps, dispatch) {
            dispatch({ type: 'BAR' });
          }
        });
        expect(consoleErrorSpy.calls.length).toBe(1);
        expect(consoleErrorSpy.calls[0].arguments[0]).toBe(
          'warning: in logic for type(s): * - single-dispatch mode is deprecated, call done when finished dispatching. For non-ending logic, set warnTimeout: 0'
        );
      });
    }
  });

  describe('use of single-dispatch mode warnTimeout: 200 w/o dispatchMultiple', () => {
    let consoleErrorSpy;
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });

    if (NODE_ENV === 'production') {
      it('PROD should not have called console.error with warning', () => {
        expect(consoleErrorSpy.calls.length).toBe(0);
      });
    } else { // not production
      it('warn that single-dispatch mode is deprecated', () => {
        createLogic({
          type: '*',
          warnTimeout: 200,
          process(deps, dispatch) {
            dispatch({ type: 'BAR' });
          }
        });
        expect(consoleErrorSpy.calls.length).toBe(1);
        expect(consoleErrorSpy.calls[0].arguments[0]).toBe(
          'warning: in logic for type(s): * - single-dispatch mode is deprecated, call done when finished dispatching. For non-ending logic, set warnTimeout: 0'
        );
      });
    }
  });

  describe('use of single-dispatch mode w/dispatchMultiple=true', () => {
    let consoleErrorSpy;
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });

    if (NODE_ENV === 'production') {
      it('PROD should not have called console.error with warning', () => {
        expect(consoleErrorSpy.calls.length).toBe(0);
      });
    } else { // not production
      it('should only warn about dispatchMultiple true in next version', () => {
        createLogic({
          type: '*',
          processOptions: { dispatchMultiple: true },
          process(deps, dispatch) {
            dispatch({ type: 'BAR' });
          }
        });
        expect(consoleErrorSpy.calls.length).toBe(1);
        expect(consoleErrorSpy.calls[0].arguments[0]).toBe(
          'warning: in logic for type(s): * - dispatchMultiple is always true in next version. For non-ending logic, set warnTimeout to 0'
        );
      });
    }
  });

  describe('use of single-dispatch mode w/warnTimeout:0', () => {
    let consoleErrorSpy;
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });

    it('should not log anything', () => {
      createLogic({
        type: '*',
        warnTimeout: 0,
        process(deps, dispatch) {
          dispatch({ type: 'BAR' });
        }
      });
      expect(consoleErrorSpy.calls.length).toBe(0);
    });
  });

  describe('dispatchMultiple=true warnTimeout != 0', () => {
    let consoleErrorSpy;
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });

    if (NODE_ENV === 'production') {
      it('PROD should not have called console.error with warning', () => {
        expect(consoleErrorSpy.calls.length).toBe(0);
      });
    } else { // not production
      it('should warn dispatchMultiple is always true in next version', () => {
        createLogic({
          type: /.*/,
          warnTimeout: 100,
          processOptions: {
            dispatchMultiple: true
          },
          process(deps, dispatch, done) {
            dispatch({ type: 'BAR' });
            done();
          }
        });
        expect(consoleErrorSpy.calls.length).toBe(1);
        expect(consoleErrorSpy.calls[0].arguments[0]).toBe(
          'warning: in logic for type(s): /.*/ - dispatchMultiple is always true in next version. For non-ending logic, set warnTimeout to 0'
        );
      });
    }
  });

  describe('dispatchMultiple=false warnTimeout != 0', () => {
    let consoleErrorSpy;
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });

    if (NODE_ENV === 'production') {
      it('PROD should not have called console.error with warning', () => {
        expect(consoleErrorSpy.calls.length).toBe(0);
      });
    } else { // not production
      it('should warn dispatchMultiple is always true in next version', () => {
        createLogic({
          type: ['FOO', 'BAR'],
          warnTimeout: 100,
          processOptions: {
            dispatchMultiple: false
          },
          process(deps, dispatch, done) {
            dispatch({ type: 'BAR' });
            done();
          }
        });
        expect(consoleErrorSpy.calls.length).toBe(1);
        expect(consoleErrorSpy.calls[0].arguments[0]).toBe(
          'warning: in logic for type(s): FOO,BAR - dispatchMultiple is always true in next version. For non-ending logic, set warnTimeout to 0'
        );
      });
    }
  });

  describe('warnTimeout != 0', () => {
    let consoleErrorSpy;
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });

    it('should not log', () => {
      createLogic({
        type: '*',
        warnTimeout: 100,
        process(deps, dispatch, done) {
          dispatch({ type: 'BAR' });
          done();
        }
      });
      expect(consoleErrorSpy.calls.length).toBe(0);
    });

  });

  describe('warnTimeout: 0', () => {
    let consoleErrorSpy;
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });

    it('should not log', () => {
      createLogic({
        type: '*',
        warnTimeout: 0,
        process(deps, dispatch, done) {
          dispatch({ type: 'BAR' });
          done();
        }
      });
      expect(consoleErrorSpy.calls.length).toBe(0);
    });

  });

  describe('dispatchMultiple=true warnTimeout: 0', () => {
    let consoleErrorSpy;
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });

    it('should not log', () => {
      createLogic({
        type: '*',
        warnTimeout: 0,
        processOptions: {
          dispatchMultiple: true
        },
        process(deps, dispatch, done) {
          dispatch({ type: 'BAR' });
          done();
        }
      });
      expect(consoleErrorSpy.calls.length).toBe(0);
    });

  });

  describe('dispatchMultiple=false warnTimeout: 0', () => {
    let consoleErrorSpy;
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });

    it('should not log', () => {
      createLogic({
        type: '*',
        warnTimeout: 0,
        processOptions: {
          dispatchMultiple: false
        },
        process(deps, dispatch, done) {
          dispatch({ type: 'BAR' });
          done();
        }
      });
      expect(consoleErrorSpy.calls.length).toBe(0);
    });

  });

});

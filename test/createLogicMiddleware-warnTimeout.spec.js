import expect from 'expect';
import { createLogic, createLogicMiddleware } from '../src/index';

const NODE_ENV = process.env.NODE_ENV;

describe('createLogicMiddleware-warnTimeout', () => {
  describe('process completes late', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        warnTimeout: 100,
        process({ action }, dispatch, done) {
          dispatch({
            ...action,
            type: 'BAR'
          });
          setTimeout(() => {
            done();
          }, 200); // delaying the call so we can check warnTimeout
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      mw.whenComplete(done);
    });

    if (NODE_ENV === 'production') {
      it('PROD should not have called console.error with warning', () => {
        expect(consoleErrorSpy.calls.length).toBe(0);
      });
    } else { // not production
      it('should have called console.error with warning', () => {
        expect(consoleErrorSpy.calls.length).toBe(1);
        expect(consoleErrorSpy.calls[0].arguments[0]).toBe('warning: logic (L(FOO)-0) is still running after 0.1s, forget to call done()? For non-ending logic, set warnTimeout: 0');
      });
    }

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
  });

  describe('process completes before timeout', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        warnTimeout: 100,
        process({ action }, dispatch, done) {
          dispatch({
            ...action,
            type: 'BAR'
          });
          done();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      mw.whenComplete(done);
    });

    it('should not have called console.error with warning', () => {
      expect(consoleErrorSpy.calls.length).toBe(0);
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
  });

  describe('process cancels late', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        cancelType: 'FOO_CANCEL',
        warnTimeout: 100,
        process({ action }, dispatch, done) {
          dispatch({
            ...action,
            type: 'BAR'
          });
          setTimeout(() => {
            done();
          }, 1000); // should already be cancelled anyway
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      mw.whenComplete(done);
      setTimeout(() => { // cancel after warnTimeout
        storeFn({ type: 'FOO_CANCEL' });
      }, 200);
    });

    if (NODE_ENV === 'production') {
      it('PROD should not have called console.error with warning', () => {
        expect(consoleErrorSpy.calls.length).toBe(0);
      });
    } else { // not production
      it('should have called console.error with warning', () => {
        expect(consoleErrorSpy.calls.length).toBe(1);
        expect(consoleErrorSpy.calls[0].arguments[0]).toBe('warning: logic (L(FOO)-0) is still running after 0.1s, forget to call done()? For non-ending logic, set warnTimeout: 0');
      });
    }

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
        { action: { type: 'FOO_CANCEL' }, op: 'top' },
        { nextAction: { type: 'FOO_CANCEL' }, op: 'bottom' },
        { action: { type: 'FOO' },
          name: 'L(FOO)-0',
          op: 'dispCancelled' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });
  });

  describe('process cancels before timeout', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        cancelType: 'FOO_CANCEL',
        warnTimeout: 100,
        process({ action }, dispatch, done) {
          dispatch({
            ...action,
            type: 'BAR'
          });
          setTimeout(() => {
            done(); // cancelled before it gets here
          }, 1000);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      storeFn({ type: 'FOO_CANCEL' });
      mw.whenComplete(done);
    });

    it('should not have called console.error with warning', () => {
      expect(consoleErrorSpy.calls.length).toBe(0);
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
        { action: { type: 'FOO_CANCEL' }, op: 'top' },
        { nextAction: { type: 'FOO_CANCEL' }, op: 'bottom' },
        { action: { type: 'FOO' },
          name: 'L(FOO)-0',
          op: 'dispCancelled' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });
  });

  describe('intercept completes late', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        warnTimeout: 100,
        validate({ action }, allow) {
          setTimeout(() => {
            allow(action);
          }, 200); // delaying the call so we can check warnTimeout
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      mw.whenComplete(done);
    });

    if (NODE_ENV === 'production') {
      it('PROD should not have called console.error with warning', () => {
        expect(consoleErrorSpy.calls.length).toBe(0);
      });
    } else { // not production
      it('should have called console.error with warning', () => {
        expect(consoleErrorSpy.calls.length).toBe(1);
        expect(consoleErrorSpy.calls[0].arguments[0]).toBe('warning: logic (L(FOO)-0) is still running after 0.1s, forget to call done()? For non-ending logic, set warnTimeout: 0');
      });
    }

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
  });

  describe('intercept completes before timeout', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        warnTimeout: 100,
        validate({ action }, allow) {
          allow(action);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      mw.whenComplete(done);
    });

    it('should not have called console.error with warning', () => {
      expect(consoleErrorSpy.calls.length).toBe(0);
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
  });

  describe('warnTimeout:0 process completes late', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        warnTimeout: 0,
        process({ action }, dispatch, done) {
          dispatch({
            ...action,
            type: 'BAR'
          });
          setTimeout(() => {
            done();
          }, 200); // delaying the call so we can check warnTimeout
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      mw.whenComplete(done);
    });

    it('should not have called console.error with warning', () => {
      expect(consoleErrorSpy.calls.length).toBe(0);
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
  });

  describe('warnTimeout:0 process completes before timeout', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        warnTimeout: 0,
        process({ action }, dispatch, done) {
          dispatch({
            ...action,
            type: 'BAR'
          });
          done();
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      mw.whenComplete(done);
    });

    it('should not have called console.error with warning', () => {
      expect(consoleErrorSpy.calls.length).toBe(0);
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
  });

  describe('warnTimeout:0 process cancels late', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        cancelType: 'FOO_CANCEL',
        warnTimeout: 0,
        process({ action }, dispatch, done) {
          dispatch({
            ...action,
            type: 'BAR'
          });
          setTimeout(() => {
            done();
          }, 1000); // should already be cancelled anyway
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      mw.whenComplete(done);
      setTimeout(() => { // cancel after warnTimeout
        storeFn({ type: 'FOO_CANCEL' });
      }, 200);
    });

    it('should not have called console.error with warning', () => {
      expect(consoleErrorSpy.calls.length).toBe(0);
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
        { action: { type: 'FOO_CANCEL' }, op: 'top' },
        { nextAction: { type: 'FOO_CANCEL' }, op: 'bottom' },
        { action: { type: 'FOO' },
          name: 'L(FOO)-0',
          op: 'dispCancelled' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });
  });

  describe('warnTimeout:0 process cancels before timeout', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        cancelType: 'FOO_CANCEL',
        warnTimeout: 0,
        process({ action }, dispatch, done) {
          dispatch({
            ...action,
            type: 'BAR'
          });
          setTimeout(() => {
            done(); // cancelled before it gets here
          }, 1000);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      storeFn({ type: 'FOO_CANCEL' });
      mw.whenComplete(done);
    });

    it('should not have called console.error with warning', () => {
      expect(consoleErrorSpy.calls.length).toBe(0);
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
        { action: { type: 'FOO_CANCEL' }, op: 'top' },
        { nextAction: { type: 'FOO_CANCEL' }, op: 'bottom' },
        { action: { type: 'FOO' },
          name: 'L(FOO)-0',
          op: 'dispCancelled' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });
  });

  describe('warnTimeout:0 intercept completes late', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        warnTimeout: 0,
        validate({ action }, allow) {
          setTimeout(() => {
            allow(action);
          }, 200); // delaying the call so we can check warnTimeout
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      mw.whenComplete(done);
    });

    it('should not have called console.error with warning', () => {
      expect(consoleErrorSpy.calls.length).toBe(0);
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
  });

  describe('warnTimeout:0 intercept completes before timeout', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    let consoleErrorSpy;
    const actionA = { type: 'FOO' };
    beforeEach('mock console.error', () => {
      consoleErrorSpy = expect.spyOn(console, 'error');
    });
    afterEach('reset console.error', () => {
      consoleErrorSpy.restore();
    });
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        warnTimeout: 0,
        validate({ action }, allow) {
          allow(action);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      mw.whenComplete(done);
    });

    it('should not have called console.error with warning', () => {
      expect(consoleErrorSpy.calls.length).toBe(0);
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
  });

});

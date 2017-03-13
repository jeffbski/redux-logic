import expect from 'expect';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware', () => {
  describe('createLogicMiddleware()', () => {
    let mw;

    beforeEach(() => {
      mw = createLogicMiddleware();
    });

    it('returns a mw fn with addLogic and replaceLogic props', () => {
      expect(mw).toBeA(Function);
      expect(mw.addLogic).toBeA(Function);
      expect(mw.replaceLogic).toBeA(Function);
    });

    it('returns a mw fn with an addDeps method', () => {
      expect(mw.addDeps).toBeA(Function);
    });

    it('works as middleware', () => {
      const next = expect.createSpy();
      const action = { type: 'FOO' };
      const result = mw({})(next)(action);
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(action);
      expect(result).toBe(action);
    });

    it('mw.monitor$ to monitor flow', () => {
      const monArr = [];
      mw.monitor$.subscribe(x => monArr.push(x));
      const next = expect.createSpy();
      const action = { type: 'FOO' };
      mw({})(next)(action);
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { nextAction: { type: 'FOO' }, op: 'bottom' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

    it('mw.whenComplete(fn) should resolve to promise', (done) => {
      function fn() { }
      mw.whenComplete(fn).then(done);
    });

    it('mw.whenComplete() should resolve to promise', (done) => {
      mw.whenComplete().then(done);
    });

    it('assigning a same store to mw instance is ok', () => {
      const store = {};
      mw(store); // assign to store
      mw(store); // assign to same store is ok
    });

    it('assigning a mw instance to multple stores, throws', () => {
      const assignToMultipleStores = () => {
        mw({}); // assign to first store
        mw({}); // assign to a different store
      };
      expect(assignToMultipleStores).toThrow('multiple stores');
    });
  });

  describe('createLogicMiddleware(nonArray)', () => {
    it('throws an error', () => {
      expect(() => {
        createLogicMiddleware({});
      }).toThrow('called with an array');
    });
  });

  describe('createLogicMiddleware(duplicateArray)', () => {
    it('throws an error', () => {
      const fooLogic = createLogic({ type: 'FOO' });
      const barLogic = createLogic({ type: 'BAR' });
      const arrLogic = [
        fooLogic,
        barLogic,
        fooLogic,
      ];
      expect(() => {
        createLogicMiddleware(arrLogic);
      }).toThrow('duplicate logic');
    });
  });

  describe('createLogicMiddleware(duplicateArray2)', () => {
    it('throws an error', () => {
      const fooLogic = createLogic({ type: 'FOO' });
      const barLogic = createLogic({ type: 'BAR' });
      const arrLogic = [
        fooLogic,
        barLogic,
        fooLogic,
        barLogic,
      ];
      expect(() => {
        createLogicMiddleware(arrLogic);
      }).toThrow('duplicate logic');
    });
  });

  describe('createLogicMiddleware(similarArray)', () => {
    it('is allowed', () => {
      const fooLogic = createLogic({ type: 'FOO' });
      const foo2Logic = createLogic({ type: 'FOO' });
      const arrLogic = [
        fooLogic,
        foo2Logic
      ];
      createLogicMiddleware(arrLogic);
    });
  });

  describe('[logicA] no dispatch', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    beforeEach(() => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO'
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next);
    });

    it('mw.whenComplete(fn) should be called', (done) => {
      mw.whenComplete(done);
    });
  });

  describe('[logicA] non-matching dispatch', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    beforeEach(() => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO'
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn({ type: 'BAR' });
    });

    it('mw.whenComplete(fn) should be called', (done) => {
      mw.whenComplete(done);
    });
  });

  describe('[logicA] non-matching dispatches', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    beforeEach(() => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO'
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn({ type: 'BAR' });
      storeFn({ type: 'BAZ' });
    });

    it('mw.whenComplete(fn) should be called', (done) => {
      mw.whenComplete(done);
    });
  });

  describe('[logicA] type is string, match only', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionA = { type: 'FOO' };
    const actionAResult = { type: 'FOO', allowed: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'] };
    const actionIgnore = { type: 'CAT' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow) {
          allow({
            ...action,
            allowed: ['a']
          });
        },
        process({ action }, dispatch) {
          dispatch({
            ...action,
            type: 'BAR'
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      const storeFn = mw({ dispatch })(next);
      storeFn(actionIgnore);
      storeFn(actionA);
      mw.whenComplete(done);
    });

    it('both messages hit next, one bypassed validation/transform', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionIgnore);
      expect(next.calls[1].arguments[0]).toEqual(actionAResult);
    });

    it('only matching is processed and dispatched', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionADispatch);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'CAT' }, op: 'top' },
        { nextAction: { type: 'CAT' }, op: 'bottom' },
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO', allowed: ['a'] },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', allowed: ['a'] }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAR', allowed: ['a'] },
          op: 'dispatch' },
        { action: { type: 'FOO' },
          name: 'L(FOO)-0',
          op: 'end'
         }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

    it('mw.whenComplete(fn) should resolve to promise', (done) => {
      function fn() { }
      mw.whenComplete(fn).then(done);
    });

    it('mw.whenComplete() should resolve to promise', (done) => {
      mw.whenComplete().then(done);
    });

    it('delayed mw.whenComplete() should still resolve to promise', (done) => {
      setTimeout(() => {
        mw.whenComplete().then(done);
      }, 100);
    });

  });

  describe('[logicA] type is arr of strings, match any', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionA = { type: 'FOO' };
    const actionAResult = { type: 'FOO', allowed: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'] };
    const actionIgnore = { type: 'CAT' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: ['DOG', 'FOO'],
        validate({ action }, allow) {
          allow({
            ...action,
            allowed: ['a']
          });
        },
        process({ action }, dispatch) {
          dispatch({
            ...action,
            type: 'BAR'
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionIgnore);
      storeFn(actionA);
    });

    it('both messages hit next, one bypassed validation/transform', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionIgnore);
      expect(next.calls[1].arguments[0]).toEqual(actionAResult);
    });

    it('only matching is processed and dispatched', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionADispatch);
    });
  });

  describe('[logicA] type is regex, match', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionA = { type: 'FOO' };
    const actionAResult = { type: 'FOO', allowed: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'] };
    const actionIgnore = { type: 'CAT' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: /^F.*$/,
        validate({ action }, allow) {
          allow({
            ...action,
            allowed: ['a']
          });
        },
        process({ action }, dispatch) {
          dispatch({
            ...action,
            type: 'BAR'
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionIgnore);
      storeFn(actionA);
    });

    it('both messages hit next, one bypassed validation/transform', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionIgnore);
      expect(next.calls[1].arguments[0]).toEqual(actionAResult);
    });

    it('only matching is processed and dispatched', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionADispatch);
    });
  });

  // arr of regex
  describe('[logicA] type is arr of regex, match', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionA = { type: 'FOO' };
    const actionAResult = { type: 'FOO', allowed: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'] };
    const actionIgnore = { type: 'CAT' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: [/^D.*$/, /^F.*$/],
        validate({ action }, allow) {
          allow({
            ...action,
            allowed: ['a']
          });
        },
        process({ action }, dispatch) {
          dispatch({
            ...action,
            type: 'BAR'
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionIgnore);
      storeFn(actionA);
    });

    it('both messages hit next, one bypassed validation/transform', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionIgnore);
      expect(next.calls[1].arguments[0]).toEqual(actionAResult);
    });

    it('only matching is processed and dispatched', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionADispatch);
    });
  });

  describe('[logicA] type is arr of string and regex, match', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionA = { type: 'FOO' };
    const actionAResult = { type: 'FOO', allowed: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'] };
    const actionIgnore = { type: 'CAT' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: ['EGG', 'FROG', 'FOO', /^D.*$/],
        validate({ action }, allow) {
          allow({
            ...action,
            allowed: ['a']
          });
        },
        process({ action }, dispatch) {
          dispatch({
            ...action,
            type: 'BAR'
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionIgnore);
      storeFn(actionA);
    });

    it('both messages hit next, one bypassed validation/transform', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionIgnore);
      expect(next.calls[1].arguments[0]).toEqual(actionAResult);
    });

    it('only matching is processed and dispatched', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionADispatch);
    });
  });

  describe('[logicA] type is *, matches all', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionA = { type: 'FOO' };
    const actionAResult = { type: 'FOO', allowed: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'] };
    const actionCat = { type: 'CAT', id: 2 };
    const actionCatResult = { type: 'CAT', id: 2, allowed: ['a'] };
    const actionCatDispatch = { type: 'BAR', id: 2, allowed: ['a'] };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount >= 2) { done(); }
      }
      logicA = createLogic({
        type: '*',
        validate({ action }, allow) {
          allow({
            ...action,
            allowed: ['a']
          });
        },
        process({ action }, dispatch) {
          dispatch({
            ...action,
            type: 'BAR'
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      const storeFn = mw({ dispatch })(next);
      storeFn(actionA);
      storeFn(actionCat);
    });

    it('both messages match', () => {
      expect(next.calls.length).toBe(2);
      expect(next.calls[0].arguments[0]).toEqual(actionAResult);
      expect(next.calls[1].arguments[0]).toEqual(actionCatResult);
    });

    it('both dispatched', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionADispatch);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionCatDispatch);
    });
  });


  describe('[logicA] validate allow', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'FOO', allowMe: true, allowed: ['a'] };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
                ...action,
              allowed: ['a']
            });
          } else {
            reject(action);
          }
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({})(next)(actionAllow);
      mw.whenComplete(done);
    });

    it('allow and augment action', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', allowMe: true }, op: 'top' },
        { action: { type: 'FOO', allowMe: true },
          name: 'L(FOO)-0',
          op: 'begin' },
        { action: { type: 'FOO', allowMe: true },
          nextAction: { type: 'FOO', allowMe: true, allowed: ['a'] },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', allowMe: true, allowed: ['a'] },
          op: 'bottom' },
        { action: { type: 'FOO', allowMe: true },
          name: 'L(FOO)-0',
          op: 'end'
         }
      ]);
    });
  });


  describe('[logicA] validate reject', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    const actionReject = { type: 'FOO', allowMe: false };
    const actionA = { type: 'FOO', allowMe: false, rejected: ['a'] };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      logicA = createLogic({
        name: 'logicA',
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
              ...action,
              allowed: ['a']
            });
          } else {
            reject({
                ...action,
              rejected: ['a']
            });
          }
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({})(next)(actionReject);
      mw.whenComplete(done);
    });

    it('reject and augment action', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', allowMe: false }, op: 'top' },
        { action: { type: 'FOO', allowMe: false },
          name: 'logicA',
          op: 'begin' },
        { action: { type: 'FOO', allowMe: false },
          nextAction: { type: 'FOO', allowMe: false, rejected: ['a'] },
          name: 'logicA',
          shouldProcess: false,
          op: 'next' },
        { nextAction: { type: 'FOO', allowMe: false, rejected: ['a'] },
          op: 'bottom' },
        { action: { type: 'FOO', allowMe: false },
          name: 'logicA',
          op: 'end'
         }
      ]);
    });
  });

  describe('[logicA] validate allow undefined', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    const actionAllow = { type: 'FOO', allowMe: true };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow();
          } else {
            reject(action);
          }
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({})(next)(actionAllow);
      mw.whenComplete(done);
    });

    it('allow and augment action', () => {
      expect(next.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', allowMe: true }, op: 'top' },
        { action: { type: 'FOO', allowMe: true },
          name: 'L(FOO)-0',
          op: 'begin' },
        { action: { type: 'FOO', allowMe: true },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'filtered' },
        { action: {
            allowMe: true,
            type: 'FOO'
          },
          name: 'L(FOO)-0',
          op: 'end' }
      ]);
    });
  });

  describe('[logicA] validate reject undefined', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    const actionReject = { type: 'FOO', allowMe: false };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      logicA = createLogic({
        name: 'logicA',
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
              ...action,
              allowed: ['a']
            });
          } else {
            reject();
          }
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({})(next)(actionReject);
      mw.whenComplete(done);
    });

    it('reject and augment action', () => {
      expect(next.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', allowMe: false }, op: 'top' },
        { action: { type: 'FOO', allowMe: false },
          name: 'logicA',
          op: 'begin' },
        { action: { type: 'FOO', allowMe: false },
          name: 'logicA',
          shouldProcess: false,
          op: 'filtered' },
        { action: { type: 'FOO', allowMe: false },
          name: 'logicA',
          op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

    it('mw.whenComplete(fn) should resolve to promise', (done) => {
      function fn() { }
      mw.whenComplete(fn).then(done);
    });

    it('mw.whenComplete() should resolve to promise', (done) => {
      mw.whenComplete().then(done);
    });

  });

  describe('[logicA] validate+process allow same', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'FOO', allowMe: true,
                      allowed: ['a'] };
    const actionBar = { type: 'BAR', allowMe: true,
                      allowed: ['a'], processed: ['a'] };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy();
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
                ...action,
              allowed: ['a']
            });
          } else {
            reject(action);
          }
        },
        process({ action, cancelled$ }, dispatch) {
          cancelled$.subscribe({ complete: () => done() });
          dispatch({
            ...action,
            type: 'BAR',
            processed: ['a']
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionAllow);
    });

    it('allow, augment, and transform action', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });

    it('dispatch actionBar', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', allowMe: true }, op: 'top' },
        { action: { type: 'FOO', allowMe: true },
          name: 'L(FOO)-0',
          op: 'begin' },
        { action: { type: 'FOO', allowMe: true },
          nextAction: { type: 'FOO', allowMe: true, allowed: ['a'] },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', allowMe: true, allowed: ['a'] },
          op: 'bottom' },
        { action: { type: 'FOO', allowMe: true },
          dispAction:
                     { type: 'BAR',
                       allowMe: true,
                       allowed: ['a'],
                       processed: ['a'] },
          op: 'dispatch' },
        { action: { type: 'FOO', allowMe: true },
          name: 'L(FOO)-0',
          op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

    it('mw.whenComplete(fn) should resolve to promise', (done) => {
      function fn() { }
      mw.whenComplete(fn).then(done);
    });

    it('mw.whenComplete() should resolve to promise', (done) => {
      mw.whenComplete().then(done);
    });

  });

  describe('[logicA] validate+process allow same useDispatch=true', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'FOO', allowMe: true, allowed: ['a'] };
    const actionProcess = { type: 'DOG' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCalled = 0;
      function cb() {
        if (++dispatchCalled >= 2) {
          // calling done with mw.whenComplete below
        }
      }
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
                ...action,
              allowed: ['a']
            }, { useDispatch: true });
          } else {
            reject(action);
          }
        },
        process({ action }, dispatch) {
          dispatch(actionProcess);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionAllow);
      mw.whenComplete(done);
    });

    it('allow will not call next since useDispatch=true', () => {
      expect(next.calls.length).toBe(0);
    });

    it('dispatch should be called twice for allow and process', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionProcess);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', allowMe: true }, op: 'top' },
        { action: { type: 'FOO', allowMe: true },
          name: 'L(FOO)-0',
          op: 'begin' },
        { action: { type: 'FOO', allowMe: true },
          dispAction: { type: 'FOO', allowMe: true, allowed: ['a'] },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'nextDisp' },
        { action: { type: 'FOO', allowMe: true },
          dispAction: { type: 'FOO', allowMe: true, allowed: ['a'] },
          op: 'dispatch' },
        { action: { type: 'FOO', allowMe: true },
          dispAction: { type: 'DOG' },
          op: 'dispatch' },
        { action: { type: 'FOO', allowMe: true },
          name: 'L(FOO)-0',
          op: 'end' }
      ]);
    });
  });

  describe('[logicA] validate+process allow same useDispatch=false', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'FOO', allowMe: true,
                      allowed: ['a'] };
    const actionBar = { type: 'BAR', allowMe: true,
                      allowed: ['a'], processed: ['a'] };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
                ...action,
              allowed: ['a']
            }, { useDispatch: false });
          } else {
            reject(action);
          }
        },
        process({ action }, dispatch) {
          dispatch({
            ...action,
            type: 'BAR',
            processed: ['a']
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionAllow);
    });

    it('allow, augment, and transform action', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });

    it('dispatch actionBar', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

    it('mw.whenComplete(fn) should resolve to promise', (done) => {
      function fn() { }
      mw.whenComplete(fn).then(done);
    });

    it('mw.whenComplete() should resolve to promise', (done) => {
      mw.whenComplete().then(done);
    });

  });

  describe('[logicA] validate+process allow diff', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'CAT', allowMe: true, allowed: ['a'] };
    const actionProcess = { type: 'DOG' };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCalled = 0;
      function cb() {
        if (++dispatchCalled >= 2) { /* done called by whenComplete */ }
      }
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
                ...action,
              type: 'CAT', // changing type
              allowed: ['a']
            });
          } else {
            reject(action);
          }
        },
        process({ action }, dispatch) {
          dispatch(actionProcess);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionAllow);
      mw.whenComplete(done);
    });

    it('allow will not call next since type was diff', () => {
      expect(next.calls.length).toBe(0);
    });

    it('dispatch should be called twice for allow and process', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionProcess);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', allowMe: true }, op: 'top' },
        { action: { type: 'FOO', allowMe: true },
          name: 'L(FOO)-0',
          op: 'begin' },
        { action: { type: 'FOO', allowMe: true },
          dispAction: { type: 'CAT', allowMe: true, allowed: ['a'] },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'nextDisp' },
        { action: { type: 'FOO', allowMe: true },
          dispAction: { type: 'CAT', allowMe: true, allowed: ['a'] },
          op: 'dispatch' },
        { action: { type: 'FOO', allowMe: true },
          dispAction: { type: 'DOG' },
          op: 'dispatch' },
        { action: { type: 'FOO', allowMe: true },
          name: 'L(FOO)-0',
          op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

    it('mw.whenComplete(fn) should resolve to promise', (done) => {
      function fn() { }
      mw.whenComplete(fn).then(done);
    });

    it('mw.whenComplete() should resolve to promise', (done) => {
      mw.whenComplete().then(done);
    });

  });

  describe('[logicA] validate+process allow diff useDispatch=true', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'CAT', allowMe: true, allowed: ['a'] };
    const actionProcess = { type: 'DOG' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCalled = 0;
      function cb() {
        if (++dispatchCalled >= 2) { done(); }
      }
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
                ...action,
              type: 'CAT', // changing type
              allowed: ['a']
            }, { useDispatch: true });
          } else {
            reject(action);
          }
        },
        process({ action }, dispatch) {
          dispatch(actionProcess);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionAllow);
    });

    it('allow will not call next since useDispatch = true', () => {
      expect(next.calls.length).toBe(0);
    });

    it('dispatch should be called twice for allow and process', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionProcess);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

    it('mw.whenComplete(fn) should resolve to promise', (done) => {
      function fn() { }
      mw.whenComplete(fn).then(done);
    });

    it('mw.whenComplete() should resolve to promise', (done) => {
      mw.whenComplete().then(done);
    });

  });

  describe('[logicA] validate+process allow diff useDispatch=false', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'CAT', allowMe: true, allowed: ['a'] };
    const actionProcess = { type: 'DOG' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCalled = 0;
      function cb() {
        if (++dispatchCalled >= 1) { done(); }
      }
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
                ...action,
              type: 'CAT', // changing type
              allowed: ['a']
            }, { useDispatch: false });
          } else {
            reject(action);
          }
        },
        process({ action }, dispatch) {
          dispatch(actionProcess);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionAllow);
    });

    it('allow will call next since useDispatch = false', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });

    it('dispatch should be called for process', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionProcess);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

    it('mw.whenComplete(fn) should resolve to promise', (done) => {
      function fn() { }
      mw.whenComplete(fn).then(done);
    });

    it('mw.whenComplete() should resolve to promise', (done) => {
      mw.whenComplete().then(done);
    });

  });

  describe('[logicA] validate+process reject same', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionReject = { type: 'FOO', allowMe: false };
    const actionA = { type: 'FOO', allowMe: false, rejected: ['a'] };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      dispatch = expect.createSpy()
        .andCall(() => done(new Error('should not call')));
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          reject({
            ...action,
            rejected: ['a']
          });
        },
        process({ action }, dispatch) {
          dispatch({
            ...action,
            type: 'BAR',
            processed: ['a']
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({ dispatch })(next)(actionReject);
      mw.whenComplete(done);
    });

    it('reject, augment, and transform action', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });

    it('not dispatch anything', () => {
      expect(dispatch.calls.length).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', allowMe: false }, op: 'top' },
        { action: { type: 'FOO', allowMe: false },
          name: 'L(FOO)-0',
          op: 'begin' },
        { action: { type: 'FOO', allowMe: false },
          nextAction: { type: 'FOO', allowMe: false, rejected: ['a'] },
          name: 'L(FOO)-0',
          shouldProcess: false,
          op: 'next' },
        { nextAction: { type: 'FOO', allowMe: false, rejected: ['a'] },
          op: 'bottom' },
        { action: { type: 'FOO', allowMe: false },
          name: 'L(FOO)-0',
          op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

    it('mw.whenComplete(fn) should resolve to promise', (done) => {
      function fn() { }
      mw.whenComplete(fn).then(done);
    });

    it('mw.whenComplete() should resolve to promise', (done) => {
      mw.whenComplete().then(done);
    });

  });

  describe('[logicA] validate+process reject diff', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionReject = { type: 'FOO', allowMe: false };
    const actionA = { type: 'BAR', allowMe: false, rejected: ['a'] };
    beforeEach(done => {
      next = expect.createSpy()
        .andCall(() => done(new Error('should not call next')));
      dispatch = expect.createSpy()
        .andCall(() => done());
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
                ...action,
              allowed: ['a']
            });
          } else {
            reject({
                ...action,
              type: 'BAR',
              rejected: ['a']
            });
          }
        },
        process({ action }, dispatch) {
          dispatch({
            ...action,
            type: 'BAR',
            processed: ['a']
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionReject);
    });

    it('reject with diff type should not call next', () => {
      expect(next.calls.length).toBe(0);
    });

    it('reject diff type should dispatch, no process dispatch', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

    it('mw.whenComplete(fn) should resolve to promise', (done) => {
      function fn() { }
      mw.whenComplete(fn).then(done);
    });

    it('mw.whenComplete() should resolve to promise', (done) => {
      mw.whenComplete().then(done);
    });

  });

  describe('[logicA] transform', () => {
    let mw;
    let logicA;
    let next;
    const action = { type: 'FOO' };
    const actionA = { type: 'FOO', a: 1 };
    beforeEach(done => {
      next = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: 'FOO',
        transform({ action }, next) {
          next({
            ...action,
            a: 1
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({})(next)(action);
    });

    it('transforms the action', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });
  });

  describe('createLogicMiddleware([logicA, logicB]) transforms', () => {
    let mw;
    let next;
    const action = { type: 'FOO', trans: [] };
    const actionAB = { type: 'FOO', trans: ['a', 'b'] };
    beforeEach(done => {
      next = expect.createSpy().andCall(() => done());
      const logicA = createLogic({
        type: 'FOO',
        transform({ action }, next) {
          const trans = action.trans;
          next({
            ...action,
            trans: [...trans, 'a']
          });
        }
      });
      const logicB = createLogic({
        type: 'FOO',
        transform({ action }, next) {
          const trans = action.trans;
          next({
            ...action,
            trans: [...trans, 'b']
          });
        }
      });
      mw = createLogicMiddleware([logicA, logicB]);
      mw({})(next)(action);
    });

    it('is transformed through both logicA and logicB', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionAB);
    });
  });

  describe('createLogicMiddleware([logicA(FOO), logicB(BAR|FOO]) foo transforms', () => {
    let monArr = [];
    let mw;
    let next;
    const action = { type: 'FOO', trans: [] };
    const actionAB = { type: 'FOO', trans: ['a', 'b'] };
    beforeEach(done => {
      monArr = [];
      next = expect.createSpy();
      const logicA = createLogic({
        type: 'FOO',
        transform({ action }, next) {
          const trans = action.trans;
          next({
            ...action,
            trans: [...trans, 'a']
          });
        },
        process({ action, cancelled$ }, dispatch) {
          // logicA is the last to exit since it is first
          cancelled$.subscribe({ complete: () => done() });
          dispatch();
        }
      });
      const logicB = createLogic({
        type: ['BAR', 'FOO'],
        transform({ action }, next) {
          const trans = action.trans;
          next({
            ...action,
            trans: [...trans, 'b']
          });
        }
      });
      mw = createLogicMiddleware([logicA, logicB]);
      mw.monitor$.subscribe(x => monArr.push(x));
      mw({})(next)(action);
    });

    it('is transformed through both logicA and logicB', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionAB);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO', trans: [] }, op: 'top' },
        { action: { type: 'FOO', trans: [] },
          name: 'L(FOO)-0',
          op: 'begin' },
        { action: { type: 'FOO', trans: [] },
          nextAction: { type: 'FOO', trans: ['a'] },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { action: { type: 'FOO', trans: ['a'] },
          name: 'L(BAR,FOO)-1',
          op: 'begin' },
        { action: { type: 'FOO', trans: ['a'] },
          nextAction: { type: 'FOO', trans: ['a', 'b'] },
          name: 'L(BAR,FOO)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO', trans: ['a', 'b'] }, op: 'bottom' },
        { action: { type: 'FOO', trans: ['a'] },
          name: 'L(BAR,FOO)-1',
          op: 'end' },
        { action: { type: 'FOO', trans: [] },
          name: 'L(FOO)-0',
          op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (done) => {
      mw.whenComplete(done);
    });

    it('mw.whenComplete(fn) should resolve to promise', (done) => {
      function fn() { }
      mw.whenComplete(fn).then(done);
    });

    it('mw.whenComplete() should resolve to promise', (done) => {
      mw.whenComplete().then(done);
    });

    it('delayed mw.whenComplete() should still resolve to promise', (done) => {
      setTimeout(() => {
        mw.whenComplete().then(done);
      }, 100);
    });

  });
});

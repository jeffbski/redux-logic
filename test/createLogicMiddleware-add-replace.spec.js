import expect from 'expect';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware-add-replace', () => {
  describe('createLogicMiddleware()', () => {
    let mw;

    beforeEach(() => {
      mw = createLogicMiddleware();
    });

    describe('mw.addDeps(additionalDeps)', () => {
      it('should make new deps available to hooks', done => {
        const dispatch = expect.createSpy();
        const next = expect.createSpy();
        const storeFn = mw({ dispatch })(next);
        const arrFlow = [];
        mw.addDeps({ foo: 42, bar: 'hello' });
        mw.addLogic([
          createLogic({
            type: 'CAT',
            validate({ foo, bar, action }, allow) {
              expect(foo).toBe(42);
              expect(bar).toBe('hello');
              arrFlow.push('validate');
              allow(action);
            },
            process({ foo, bar }) {
              expect(foo).toBe(42);
              expect(bar).toBe('hello');
              arrFlow.push('process');
            }
          })
        ]);
        storeFn({ type: 'CAT' });
        mw.whenComplete(() => {
          expect(arrFlow).toEqual(['validate', 'process']);
          done();
        });
      });

      it('should allow call with same values/instances', done => {
        const dispatch = expect.createSpy();
        const next = expect.createSpy();
        const storeFn = mw({ dispatch })(next);
        const arrFlow = [];
        const egg = { hey: 'world' };
        mw.addDeps({ foo: 42, bar: 'hello', egg });
        mw.addDeps({ foo: 42, bar: 'hello', dog: 21, egg });
        mw.addLogic([
          createLogic({
            type: 'CAT',
            validate({ foo, bar, dog, egg, action }, allow) {
              expect(foo).toBe(42);
              expect(bar).toBe('hello');
              expect(dog).toBe(21);
              expect(egg).toEqual({ hey: 'world' });
              arrFlow.push('validate');
              allow(action);
            },
            process({ foo, bar, dog, egg }) {
              expect(foo).toBe(42);
              expect(bar).toBe('hello');
              expect(dog).toBe(21);
              expect(egg).toEqual({ hey: 'world' });
              arrFlow.push('process');
            }
          })
        ]);
        storeFn({ type: 'CAT' });
        mw.whenComplete(() => {
          expect(arrFlow).toEqual(['validate', 'process']);
          done();
        });
      });

      it('should throw an error if values are overridden', () => {
        mw.addDeps({ foo: 42, bar: 'hello' });
        function fn() {
          mw.addDeps({ foo: 30, dog: 21 });
        }
        expect(fn).toThrow('cannot override an existing dep value: foo');
      });

      it('should throw an error if called without an object', () => {
        function fn() {
          mw.addDeps(42);
        }
        expect(fn).toThrow('called with an object');
      });

    });

    describe('mw.addLogic(duplicateArray)', () => {
      it('throws an error', () => {
        const dispatch = expect.createSpy();
        const next = expect.createSpy();
        const fooLogic = createLogic({ type: 'FOO' });
        const barLogic = createLogic({ type: 'BAR' });
        const arrLogic = [
          fooLogic,
          barLogic
        ];
        const mw = createLogicMiddleware(arrLogic);
        mw({ dispatch })(next); // simulate store creation
        expect(() => {
          mw.addLogic([fooLogic]); // duplicates existing
        }).toThrow('duplicate logic');
      });
    });

    describe('mw.addLogic(duplicateArray2)', () => {
      it('throws an error', () => {
        const dispatch = expect.createSpy();
        const next = expect.createSpy();
        const fooLogic = createLogic({ type: 'FOO' });
        const barLogic = createLogic({ type: 'BAR' });
        const arrLogic = [
          fooLogic,
          barLogic,
          fooLogic
        ];
        const mw = createLogicMiddleware();
        mw({ dispatch })(next); // simulate store creation
        expect(() => {
          mw.addLogic(arrLogic); // has duplicates
        }).toThrow('duplicate logic');
      });
    });

    describe('mw.createLogicMiddleware(arr1), mw.replaceLogic([]), mw.addLogic(arr1)', () => {
      it('should be ok', () => {
        const next = expect.createSpy();
        const fooLogic = createLogic({ type: 'FOO' });
        const barLogic = createLogic({ type: 'BAR' });
        const arrLogic = [
          fooLogic,
          barLogic
        ];
        const mw = createLogicMiddleware(arrLogic);
        mw({})(next); // simulate store creation
        mw.replaceLogic([]);
        mw.addLogic(arrLogic);
      });
    });

    describe('mw.mergeNewLogic(duplicateInArray)', () => {
      it('throws an error', () => {
        const dispatch = expect.createSpy();
        const next = expect.createSpy();
        const fooLogic = createLogic({ type: 'FOO' });
        const barLogic = createLogic({ type: 'BAR' });
        const arrLogic = [
          fooLogic,
          barLogic,
          fooLogic
        ];
        const mw = createLogicMiddleware();
        mw({ dispatch })(next); // simulate store creation
        expect(() => {
          mw.mergeNewLogic(arrLogic); // duplicates existing
        }).toThrow('duplicate logic');
      });
    });

    describe('mw.mergeNewLogic(allRepeatArray)', () => {
      it('is ok', () => {
        const dispatch = expect.createSpy();
        const next = expect.createSpy();
        const fooLogic = createLogic({ type: 'FOO' });
        const barLogic = createLogic({ type: 'BAR' });
        const arrLogic = [
          fooLogic,
          barLogic
        ];
        const mw = createLogicMiddleware(arrLogic);
        mw({ dispatch })(next); // simulate store creation
        mw.mergeNewLogic(arrLogic); // duplicates existing
      });
    });

    describe('mw.mergeNewLogic(someNewArray)', () => {
      it('is ok', () => {
        const dispatch = expect.createSpy();
        const next = expect.createSpy();
        const fooLogic = createLogic({ type: 'FOO' });
        const barLogic = createLogic({ type: 'BAR' });
        const catLogic = createLogic({ type: 'CAT' });
        const arrLogic = [
          fooLogic,
          barLogic
        ];
        const someNewLogic = [
          fooLogic,
          barLogic,
          catLogic // new logic
        ];

        const mw = createLogicMiddleware(arrLogic);
        mw({ dispatch })(next); // simulate store creation
        mw.mergeNewLogic(someNewLogic); // has duplicates
      });
    });

    describe('mw.replaceLogic(matchesOld)', () => {
      it('is allowed', () => {
        const dispatch = expect.createSpy();
        const next = expect.createSpy();
        const fooLogic = createLogic({ type: 'FOO' });
        const foo2Logic = createLogic({ type: 'FOO' });
        const arrLogic = [
          fooLogic,
          foo2Logic
        ];
        const mw = createLogicMiddleware(arrLogic);
        mw({ dispatch })(next); // simulate store creation
        mw.replaceLogic(arrLogic); // matching old is fine
      });
    });

    describe('mw.replaceLogic(duplicateArray)', () => {
      it('throws an error', () => {
        const dispatch = expect.createSpy();
        const next = expect.createSpy();
        const fooLogic = createLogic({ type: 'FOO' });
        const barLogic = createLogic({ type: 'BAR' });
        const arrLogic = [
          fooLogic,
          barLogic,
          fooLogic
        ];
        const mw = createLogicMiddleware();
        mw({ dispatch })(next); // simulate store creation
        expect(() => {
          mw.replaceLogic(arrLogic); // has duplicates
        }).toThrow('duplicate logic');
      });
    });

    describe('no store, mw.addLogic([logic1])', () => {
      const action2 = { type: 'FOO', tid: 1 };
      it('should throw with error store is not defined', () => {
        const logic = createLogic({
          type: 'FOO',
          transform(deps, next) {
            next(action2);
          }
        });
        expect(() => {
          mw.addLogic([logic]);
        }).toThrow('store is not defined');
      });
    });

    describe('no next fn, mw.addLogic([logic1])', () => {
      const action2 = { type: 'FOO', tid: 1 };
      it('should throw with error store is not defined', () => {
        expect(() => {
          mw({})(undefined); // shouldn't really happen
          const logic = createLogic({
            type: 'FOO',
            transform(deps, next) {
              next(action2);
            }
          });
          mw.addLogic([logic]);
        }).toThrow('store is not defined');
      });
    });

    describe('mw.addLogic([logic1])', () => {
      let monArr = [];
      let logicCount;
      let next;
      let storeFn;
      const action1 = { type: 'FOO' };
      const action2 = { type: 'FOO', tid: 1 };
      beforeEach(done => {
        monArr = [];
        mw.monitor$.subscribe(x => monArr.push(x));
        next = expect.createSpy();
        storeFn = mw({})(next);
        const logic = createLogic({
          type: 'FOO',
          transform(deps, next) {
            next(action2);
          }
        });
        const result = mw.addLogic([logic]);
        logicCount = result.logicCount;
        storeFn(action1);
        mw.whenComplete(done);
      });

      it('should return count of 1', () => {
        expect(logicCount).toBe(1);
      });

      it('should transform action', () => {
        expect(next.calls.length).toBe(1);
        expect(next.calls[0].arguments[0]).toEqual(action2);
      });

      it('mw.monitor$ should track flow', () => {
        expect(monArr).toEqual([
          { action: { type: 'FOO' }, op: 'top' },
          { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
          { action: { type: 'FOO' },
            nextAction: { type: 'FOO', tid: 1 },
            name: 'L(FOO)-0',
            shouldProcess: true,
            op: 'next' },
          { nextAction: { type: 'FOO', tid: 1 }, op: 'bottom' },
          { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
        ]);
      });
    });

    describe('mw.replaceLogic([logic1])', () => {
      let monArr = [];
      let logicCount;
      let next;
      let storeFn;
      const action1 = { type: 'FOO' };
      const action2 = { type: 'FOO', tid: 1 };
      beforeEach(done => {
        monArr = [];
        mw.monitor$.subscribe(x => monArr.push(x));
        next = expect.createSpy();
        storeFn = mw({})(next);
        const logic = createLogic({
          type: 'FOO',
          transform(deps, next) {
            next(action2);
          }
        });
        const result = mw.replaceLogic([logic]);
        logicCount = result.logicCount;
        storeFn(action1);
        mw.whenComplete(done);
      });

      it('should return count of 1', () => {
        expect(logicCount).toBe(1);
      });

      it('should transform action', () => {
        expect(next.calls.length).toBe(1);
        expect(next.calls[0].arguments[0]).toEqual(action2);
      });

      it('mw.monitor$ should track flow', () => {
        expect(monArr).toEqual([
          { action: { type: 'FOO' }, op: 'top' },
          { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
          { action: { type: 'FOO' },
            nextAction: { type: 'FOO', tid: 1 },
            name: 'L(FOO)-0',
            shouldProcess: true,
            op: 'next' },
          { nextAction: { type: 'FOO', tid: 1 }, op: 'bottom' },
          { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
        ]);
      });

    });
  });

  describe('createLogicMiddleware([logicA])', () => {
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

    it('returns a mw fn with addLogic and replaceLogic props', () => {
      expect(mw).toBeA(Function);
      expect(mw.addLogic).toBeA(Function);
      expect(mw.replaceLogic).toBeA(Function);
    });

    it('works as middleware', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });

    describe('mw.addLogic([logic1])', () => {
      let monArr = [];
      let logicCount;
      let next;
      let storeFn;
      const action1 = { type: 'FOO' };
      const actionA2 = { type: 'FOO', a: 1, tid: 2 };
      beforeEach(done => {
        monArr = [];
        // reset mw
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => monArr.push(x));

        next = expect.createSpy();
        storeFn = mw({})(next);
        const logic = createLogic({
          type: 'FOO',
          transform({ action }, next) {
            next({
              ...action,
              tid: 2
            });
          }
        });
        const result = mw.addLogic([logic]);
        logicCount = result.logicCount;
        storeFn(action1);
        mw.whenComplete(done);
      });

      it('should return count of 2', () => {
        expect(logicCount).toBe(2);
      });

      it('should transform action', () => {
        expect(next.calls.length).toBe(1);
        expect(next.calls[0].arguments[0]).toEqual(actionA2);
      });

      it('mw.monitor$ should track flow', () => {
        expect(monArr).toEqual([
          { action: { type: 'FOO' }, op: 'top' },
          { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
          { action: { type: 'FOO' },
            nextAction: { type: 'FOO', a: 1 },
            name: 'L(FOO)-0',
            shouldProcess: true,
            op: 'next' },
          { action: { type: 'FOO', a: 1 }, name: 'L(FOO)-1', op: 'begin' },
          { action: { type: 'FOO', a: 1 },
            nextAction: { type: 'FOO', a: 1, tid: 2 },
            name: 'L(FOO)-1',
            shouldProcess: true,
            op: 'next' },
          { nextAction: { type: 'FOO', a: 1, tid: 2 }, op: 'bottom' },
          { action: { type: 'FOO', a: 1 }, name: 'L(FOO)-1', op: 'end' },
          { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
        ]);
      });
    });

    describe('mw.mergeNewLogic([logicA, logic1])', () => {
      let monArr = [];
      let logicCount;
      let next;
      let storeFn;
      const action1 = { type: 'FOO' };
      const actionA2 = { type: 'FOO', a: 1, tid: 2 };
      beforeEach(done => {
        monArr = [];
        // reset mw
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => monArr.push(x));

        next = expect.createSpy();
        storeFn = mw({})(next);
        const logic = createLogic({
          type: 'FOO',
          transform({ action }, next) {
            next({
              ...action,
              tid: 2
            });
          }
        });
        const result = mw.mergeNewLogic([logicA, logic]);
        logicCount = result.logicCount;
        storeFn(action1);
        mw.whenComplete(done);
      });

      it('should return count of 2', () => {
        expect(logicCount).toBe(2);
      });

      it('should transform action', () => {
        expect(next.calls.length).toBe(1);
        expect(next.calls[0].arguments[0]).toEqual(actionA2);
      });

      it('mw.monitor$ should track flow', () => {
        expect(monArr).toEqual([
          { action: { type: 'FOO' }, op: 'top' },
          { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
          { action: { type: 'FOO' },
            nextAction: { type: 'FOO', a: 1 },
            name: 'L(FOO)-0',
            shouldProcess: true,
            op: 'next' },
          { action: { type: 'FOO', a: 1 }, name: 'L(FOO)-1', op: 'begin' },
          { action: { type: 'FOO', a: 1 },
            nextAction: { type: 'FOO', a: 1, tid: 2 },
            name: 'L(FOO)-1',
            shouldProcess: true,
            op: 'next' },
          { nextAction: { type: 'FOO', a: 1, tid: 2 }, op: 'bottom' },
          { action: { type: 'FOO', a: 1 }, name: 'L(FOO)-1', op: 'end' },
          { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
        ]);
      });
    });

    describe('mw.replaceLogic([logic1])', () => {
      let monArr = [];
      let logicCount;
      let next;
      let storeFn;
      const action1 = { type: 'FOO' };
      const action2 = { type: 'FOO', tid: 2 };
      beforeEach(done => {
        monArr = [];
        // reset mw
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => monArr.push(x));

        next = expect.createSpy();
        storeFn = mw({})(next);
        const logic = createLogic({
          type: 'FOO',
          transform({ action }, next) {
            next({
              ...action,
              tid: 2
            });
          }
        });
        const result = mw.replaceLogic([logic]);
        logicCount = result.logicCount;
        storeFn(action1);
        mw.whenComplete(done);
      });

      it('should return count of 1', () => {
        expect(logicCount).toBe(1);
      });

      it('should transform action', () => {
        expect(next.calls.length).toBe(1);
        expect(next.calls[0].arguments[0]).toEqual(action2);
      });

      it('mw.monitor$ should track flow', () => {
        expect(monArr).toEqual([
          { action: { type: 'FOO' }, op: 'top' },
          { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
          { action: { type: 'FOO' },
            nextAction: { type: 'FOO', tid: 2 },
            name: 'L(FOO)-0',
            shouldProcess: true,
            op: 'next' },
          { nextAction: { type: 'FOO', tid: 2 }, op: 'bottom' },
          { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
        ]);
      });

    });
  });
});

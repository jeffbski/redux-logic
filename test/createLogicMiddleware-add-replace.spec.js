import expect from 'expect';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware-add-replace', () => {
  describe('createLogicMiddleware()', () => {
    let mw;

    beforeEach(() => {
      mw = createLogicMiddleware();
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
          { action: { type: 'FOO', tid: 1 }, op: 'bottom' },
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
          { action: { type: 'FOO', tid: 1 }, op: 'bottom' },
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
          { action: { type: 'FOO', a: 1, tid: 2 }, op: 'bottom' },
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
          { action: { type: 'FOO', tid: 2 }, op: 'bottom' },
          { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
        ]);
      });

    });
  });
});

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

    it('works as middleware', () => {
      const next = expect.createSpy();
      const action = { type: 'FOO' };
      const result = mw({})(next)(action);
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(action);
      expect(result).toBe(action);
    });
  });

  describe('createLogicMiddleware([logicA]) validate allow', () => {
    let mw;
    let logicA;
    let next;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'FOO', allowMe: true, allowed: ['a'] };
    beforeEach(done => {
      next = expect.createSpy().andCall(() => done());
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
      mw({})(next)(actionAllow);
    });

    it('allow and augment action', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });
  });

  describe('createLogicMiddleware([logicA]) validate reject', () => {
    let mw;
    let logicA;
    let next;
    const actionReject = { type: 'FOO', allowMe: false };
    const actionA = { type: 'FOO', allowMe: false, rejected: ['a'] };
    beforeEach(done => {
      next = expect.createSpy().andCall(() => done());
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
              rejected: ['a']
            });
          }
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({})(next)(actionReject);
    });

    it('reject and augment action', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });
  });

  describe('createLogicMiddleware([logicA]) validate+transform+process allow', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'FOO', allowMe: true,
                      allowed: ['a'], trans: ['a'] };
    const actionBar = { type: 'BAR', allowMe: true,
                      allowed: ['a'], trans: ['a'], processed: ['a'] };
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
            });
          } else {
            reject(action);
          }
        },
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
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
  });

  describe('createLogicMiddleware([logicA]) validate+transform+process reject', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionReject = { type: 'FOO', allowMe: false };
    const actionA = { type: 'FOO', allowMe: false, rejected: ['a'], trans: ['a'] };
    beforeEach(done => {
      next = expect.createSpy().andCall(() => done());
      dispatch = expect.createSpy()
        .andCall(() => done(new Error('should not call')));
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
              rejected: ['a']
            });
          }
        },
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
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
      mw({ dispatch })(next)(actionReject);
    });

    it('reject, augment, and transform action', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });

    it('not dispatch anything', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('createLogicMiddleware([logicA]) valid+trans reject same type', () => {
    let mw;
    let logicA;
    let next;
    const actionReject = { type: 'FOO', allowMe: false };
    const actionA = { type: 'FOO', allowMe: false,
                      rejected: ['a'], trans: ['a'] };
    beforeEach(done => {
      next = expect.createSpy().andCall(() => done());
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
              rejected: ['a']
            });
          }
        },
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({})(next)(actionReject);
    });

    it('reject and augment action', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });
  });

  describe('createLogicMiddleware([logicA]) valid+trans reject other type', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionReject = { type: 'FOO', allowMe: false };
    const actionA = { type: 'BAR' };
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
            });
          } else {
            reject(actionA); // rejecting with diff type, will dispatch
          }
        },
        // since dispatched won't do transform
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
          });
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionReject);
    });

    it('next should not be called', () => {
      expect(next.calls.length).toBe(0);
    });

    it('dispatch will be called with actionA', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
    });
  });

  describe('createLogicMiddleware([logicA]) transform', () => {
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

  describe('createLogicMiddleware([logicA]) process', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionFoo = { type: 'FOO' };
    const actionBar = { type: 'BAR', a: 1 };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: 'FOO',
        process(deps, dispatch) {
          dispatch(actionBar);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionFoo);
    });

    it('passes actionFoo through next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionFoo);
    });

    it('dispatches actionBar', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });
  });


});

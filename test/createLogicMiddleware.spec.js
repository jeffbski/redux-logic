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

  describe('[logicA] type is string, match only', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionA = { type: 'FOO' };
    const actionAResult = { type: 'FOO', allowed: ['a'], trans: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'], trans: ['a'] };
    const actionIgnore = { type: 'CAT' };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(() => done());
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow) {
          allow({
            ...action,
            allowed: ['a']
          });
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

  describe('[logicA] type is arr of strings, match any', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionA = { type: 'FOO' };
    const actionAResult = { type: 'FOO', allowed: ['a'], trans: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'], trans: ['a'] };
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
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
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
    const actionAResult = { type: 'FOO', allowed: ['a'], trans: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'], trans: ['a'] };
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
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
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
    const actionAResult = { type: 'FOO', allowed: ['a'], trans: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'], trans: ['a'] };
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
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
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
    const actionAResult = { type: 'FOO', allowed: ['a'], trans: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'], trans: ['a'] };
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
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
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
    const actionAResult = { type: 'FOO', allowed: ['a'], trans: ['a'] };
    const actionADispatch = { type: 'BAR', allowed: ['a'], trans: ['a'] };
    const actionCat = { type: 'CAT', id: 2 };
    const actionCatResult = { type: 'CAT', id: 2, allowed: ['a'], trans: ['a'] };
    const actionCatDispatch = { type: 'BAR', id: 2, allowed: ['a'], trans: ['a'] };
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
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
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


  describe('[logicA] validate reject', () => {
    let mw;
    let logicA;
    let next;
    const actionReject = { type: 'FOO', allowMe: false };
    const actionA = { type: 'FOO', allowMe: false, rejected: ['a'] };
    beforeEach(done => {
      next = expect.createSpy().andCall(() => done());
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
      mw({})(next)(actionReject);
    });

    it('reject and augment action', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });
  });

  describe('[logicA] validate+transform+process allow same', () => {
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

  describe('[logicA] validate+transform+process allow same useDispatch=true', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'FOO', allowMe: true, allowed: ['a'] };
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
              allowed: ['a']
            }, { useDispatch: true });
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
          dispatch(actionProcess);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionAllow);
    });

    it('allow will not call next since useDispatch=true', () => {
      expect(next.calls.length).toBe(0);
    });

    it('dispatch should be called twice for allow and process', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionProcess);
    });
  });

  describe('[logicA] validate+transform+process allow same useDispatch=false', () => {
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
            }, { useDispatch: false });
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

  describe('[logicA] validate+transform+process allow next same useDispatch=true', () => {
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
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCalls = 0;
      function cb() {
        if (++dispatchCalls === 2) { done(); }
      }
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
          }, { useDispatch: true });
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

    it('next had useDispatch = true, no next calls', () => {
      expect(next.calls.length).toBe(0);
    });

    it('dispatch will be called for trans.next and process', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionBar);
    });
  });

  describe('[logicA] validate+transform+process allow next same useDispatch=false', () => {
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
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCalls = 0;
      function cb() {
        if (++dispatchCalls === 1) { done(); }
      }
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
          }, { useDispatch: false });
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

    it('next had useDispatch = false, calls next', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });

    it('dispatch will be called for process', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });
  });

  describe('[logicA] v+t+p allow diff useDisp=false next same useDisp=true', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'CAT', allowMe: true,
                      allowed: ['a'], trans: ['a'] };
    const actionBar = { type: 'BAR', allowMe: true,
                      allowed: ['a'], trans: ['a'], processed: ['a'] };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCalls = 0;
      function cb() {
        if (++dispatchCalls === 2) { done(); }
      }
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
                ...action,
              type: 'CAT', // change type
              allowed: ['a']
            }, { useDispatch: false });
          } else {
            reject(action);
          }
        },
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
          }, { useDispatch: true });
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

    it('next had useDispatch = true, no next', () => {
      expect(next.calls.length).toBe(0);
    });

    it('dispatch will be called for trans.next and process', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionBar);
    });
  });

  describe('[logicA] v+t+p allow diff useDispatch=false next same useDispatch=false', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'CAT', allowMe: true,
                      allowed: ['a'], trans: ['a'] };
    const actionBar = { type: 'BAR', allowMe: true,
                      allowed: ['a'], trans: ['a'], processed: ['a'] };
    beforeEach(done => {
      next = expect.createSpy();
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCalls = 0;
      function cb() {
        if (++dispatchCalls === 1) { done(); }
      }
      logicA = createLogic({
        type: 'FOO',
        validate({ action }, allow, reject) {
          if (action.allowMe) {
            allow({
                ...action,
              type: 'CAT', // change type
              allowed: ['a']
            }, { useDispatch: false });
          } else {
            reject(action);
          }
        },
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
          }, { useDispatch: false });
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

    it('next had useDispatch = false, next called', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });

    it('dispatch will be called for process', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
    });
  });

  describe('[logicA] validate+transform+process allow diff', () => {
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
          dispatch(actionProcess);
        }
      });
      mw = createLogicMiddleware([logicA]);
      mw({ dispatch })(next)(actionAllow);
    });

    it('allow will not call next since type was diff', () => {
      expect(next.calls.length).toBe(0);
    });

    it('dispatch should be called twice for allow and process', () => {
      expect(dispatch.calls.length).toBe(2);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
      expect(dispatch.calls[1].arguments[0]).toEqual(actionProcess);
    });
  });

  describe('[logicA] validate+transform+process allow diff useDispatch=true', () => {
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
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
          });
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
  });

  describe('[logicA] validate+transform+process allow diff useDispatch=false', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
    const actionA = { type: 'CAT', allowMe: true, allowed: ['a'], trans: ['a'] };
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
        transform({ action }, next) {
          next({
            ...action,
            trans: ['a']
          });
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
  });

  describe('[logicA] validate+transform+process reject same', () => {
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

  describe('[logicA] validate+transform+process reject same next diff', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionReject = { type: 'FOO', allowMe: false };
    const actionA = { type: 'CAT', allowMe: false, rejected: ['a'], trans: ['a'] };
    beforeEach(done => {
      next = expect.createSpy()
        .andCall(() => done(new Error('should not call')));
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount === 1) { done(); }
      }
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
            type: 'CAT', // changed type
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

    it('next diff, no next call', () => {
      expect(next.calls.length).toBe(0);
    });

    it('dispatch for trans.next, no process on reject', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
    });
  });

  describe('[logicA] validate+transform+process reject same next useDispatch=true', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionReject = { type: 'FOO', allowMe: false };
    const actionA = { type: 'FOO', allowMe: false, rejected: ['a'], trans: ['a'] };
    beforeEach(done => {
      next = expect.createSpy()
        .andCall(() => done(new Error('should not call')));
      dispatch = expect.createSpy().andCall(cb);
      let dispatchCount = 0;
      function cb() {
        if (++dispatchCount === 1) { done(); }
      }
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
          }, { useDispatch: true });
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

    it('next diff, no next call', () => {
      expect(next.calls.length).toBe(0);
    });

    it('dispatch for trans.next, no process on reject', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
    });
  });

// [logicA] validate+transform+process reject same next useDispatch=false - 1
  describe('[logicA] validate+transform+process reject same next useDispatch=false', () => {
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionReject = { type: 'FOO', allowMe: false };
    const actionA = { type: 'CAT', allowMe: false, rejected: ['a'], trans: ['a'] };
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
            type: 'CAT', // changed type
            trans: ['a']
          }, { useDispatch: false });
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

    it('next useDispatch=false, next call', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionA);
    });

    it('no dispatches on reject', () => {
      expect(dispatch.calls.length).toBe(0);
    });
  });

  describe('[logicA] validate+transform+process reject diff', () => {
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

    it('reject with diff type should not call next', () => {
      expect(next.calls.length).toBe(0);
    });

    it('reject diff type should dispatch, no process dispatch', () => {
      expect(dispatch.calls.length).toBe(1);
      expect(dispatch.calls[0].arguments[0]).toEqual(actionA);
    });
  });

  describe('[logicA] valid+trans reject same type', () => {
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

  describe('[logicA] valid+trans reject other type', () => {
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
      mw({})(next)(action);
    });

    it('is transformed through both logicA and logicB', () => {
      expect(next.calls.length).toBe(1);
      expect(next.calls[0].arguments[0]).toEqual(actionAB);
    });
  });

});

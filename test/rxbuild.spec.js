import expect from 'expect-legacy';
import createLogicAction$ from '../src/createLogicAction$';
import createLogicMiddleware from '../src/createLogicMiddleware';
import logicWrapper from '../src/logicWrapper';
import createLogic from '../src/createLogic';

/*
   Run this test separately with npm run test:rxbuild so that it is
   loaded in isolation and not along with other tests that import
   the entire Rx package for convenience. By testing in isolation
   only the custom properties are included and the initial load
   triggers a check to confirm the props, throwing if missing.
 */

describe('rxbuild', () => {
  it('createLogicAction$ should load verifying its rx props', () => {
    expect(createLogicAction$).toExist();
  });

  it('createLogicMiddleware should load verifying its rx props', () => {
    expect(createLogicMiddleware).toExist();
  });

  it('logicWrapper should load verifying its rx props', () => {
    expect(logicWrapper).toExist();
  });

  // run through a representative run to exercise the code
  // to see if any rx operators are missing

  describe('[logicA] validate+process allow same', () => {
    let monArr = [];
    let mw;
    let logicA;
    let next;
    let dispatch;
    const actionAllow = { type: 'FOO', allowMe: true };
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
      mw({ dispatch })(next)(actionAllow);
      mw.whenComplete(() => done());
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

  });

});

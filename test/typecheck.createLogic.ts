/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   A test for the typescript definition
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2018 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { configureLogic, createLogic } from '../';

import { ErroneousAction, StandardAction } from '../';
import { ActionBasis, MetaBasis, PayloadBasis } from '../definitions/action';

import { Dependency, Meta, Payload, State } from './typecheck';

/* ----- configureLogic ----- */

{
  configureLogic({
    warnTimeout: 10000
  });
}

// ---------------------------------------- //

/* ----- createLogic ----- */

{
  const fn = () => {};
  fn.toString = () => 'fn';
  const logic = createLogic({
    name: fn,
    type: 'type'
  });
}

{
  const fn1 = () => {};
  fn1.toString = () => 'type1';
  const fn2 = () => {};
  fn2.toString = () => 'type2';
  const logic = createLogic({
    type: [fn1, fn2]
  });
}

{
  const logic = createLogic({
    type: 'type'
  });
}

{
  const logic = createLogic({
    type: /type/
  });
}

{
  const logic = createLogic({
    type: ['type']
  });
}

{
  const logic = createLogic({
    type: [/type/]
  });
}

{
  const logic = createLogic({
    type: 'type',
    cancelType: 'type'
  });
}

{
  const logic = createLogic({
    type: 'type',
    cancelType: /type/
  });
}

{
  const logic = createLogic({
    type: 'type',
    cancelType: ['type']
  });
}

{
  const logic = createLogic({
    type: 'type',
    cancelType: [/type/]
  });
}

{
  const logic = createLogic({
    type: 'type',
    cancelType: () => ({ type: 'cancelType' })
  });
}

{
  const logic = createLogic({
    type: 'type',
    cancelType: (): StandardAction<'cancelType', { source: string }> => ({
      type: 'cancelType',
      payload: { source: 'somewhere' }
    })
  });
}

{
  const logic = createLogic({
    type: 'type',
    cancelType: [
      () => ({ type: 'cancelType1', payload: { source: 'somewhere' } }),
      () => ({ type: 'cancelType2', payload: { source: 'somewhere' } })
    ]
  });
}

{
  const logic = createLogic({
    name: 'name',
    type: 'type',
    debounce: 0,
    throttle: 0,
    latest: true,
    warnTimeout: 60000
  });
}

{
  const logic = createLogic<State, Dependency, 'type'>({
    type: 'type',
    validate({ getState, action }, allow, reject) {
      let state: State = getState();
      let expectedAction:
        | (StandardAction<'type'>)
        | ErroneousAction<'type'> = action;
      allow(action);
      reject(action);
    }
  });
}

{
  const logic = createLogic<State, Dependency, 'type'>({
    type: 'type',
    transform({ getState, action }, next) {
      let state: State = getState();
      let expectedAction:
        | (StandardAction<'type'>)
        | ErroneousAction<'type'> = action;
      next(action);
    }
  });
}

{
  const logic = createLogic<State, Dependency, 'type'>({
    type: 'type',
    process() {}
  });
}

{
  const logic = createLogic<State, Dependency, 'type'>({
    type: 'type',
    processOptions: {
      dispatchReturn: true,
      successType: 'successType'
    },
    process({ getState, action, cancelled$ }): void {
      let state: State = getState();
      let expectedAction:
        | (StandardAction<'type'>)
        | ErroneousAction<'type'> = action;

      cancelled$.subscribe({
        next: () => {}
      });
    }
  });
}

{
  const logic = createLogic<State, Payload, Meta, Dependency, 'type'>({
    type: 'type',
    processOptions: {
      dispatchReturn: true,
      successType: (payload: Payload) => ({ type: 'successType' })
    },
    process({ getState, action, cancelled$ }) {
      let state: State = getState();
      let expectedAction:
        | (ActionBasis<'type'> & PayloadBasis<Payload> & MetaBasis<Meta>)
        | ErroneousAction<'type'> = action;
    }
  });
}

{
  const logic = createLogic<State, Dependency, 'type'>({
    type: 'type',
    processOptions: {
      dispatchReturn: true,
      dispatchMultiple: false
    },
    process(depObj) {
      let dep: Dependency = depObj;
      let state: State = depObj.getState();
      let expectedAction: (ActionBasis<'type'>) | ErroneousAction<'type'> =
        depObj.action;
    }
  });
}

{
  const logic = createLogic<State, Dependency, 'type'>({
    type: 'type',
    processOptions: {
      dispatchReturn: false,
      dispatchMultiple: true
    },
    process(depObj, dispatch, done) {
      let state: State = depObj.getState();
      let expectedAction: (ActionBasis<'type'>) | ErroneousAction<'type'> =
        depObj.action;

      dispatch({
        type: 'newType'
      });
      done();
    }
  });
}

{
  const logic = createLogic({
    type: 'type',
    debounce: 40,
    process({ action }, dispatch) {
      setTimeout(() => {
        dispatch({
          ...action,
          type: 'newType'
        });
      }, 100);
    }
  });
}

{
  let meta: Meta;

  const logic = createLogic({
    type: 'type',
    debounce: 40,
    process({ action }, dispatch) {
      setTimeout(() => {
        dispatch({
          ...action,
          type: 'newType',
          meta
        });
      }, 100);
    }
  });
}

//
// EXPECT ERROR
//

// {
//   const logic = createLogic();
// }

// {
//   const logic = createLogic({});
// }

// {
//   const logic = createLogic({
//     type: '*',
//     processOptions: {
//       warnTimeout: 120000
//     }
//   });
// }

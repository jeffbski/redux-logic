/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Definitions for redux-logic
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2018 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { Subject } from 'rxjs';

import { Middleware } from 'redux';

import { Action, ArgumentAction } from './action';
import { Logic } from './logic';
import { Object } from './utilities';

//
// MIDDLEWARE
//

interface LogicMiddleware<
  State extends object = {},
  Dependency extends object = {},
  Context extends Object = undefined,
  Type extends string = string
> extends Middleware {
  (store: CreateLogicMiddleware.Store<State>): CreateLogicMiddleware.Next;

  monitor$: Subject<{
    action?:
      | 'op'
      | 'top'
      | 'bottom'
      | 'begin'
      | 'nesxPartial<t'
      | 'nextDisp'
      | 'nextError'
      | 'filtered'
      | 'cancelled'
      | 'dispatch'
      | 'dispCancelled'
      | 'end';
    name?: string;
    nextAction?: Action;
    shouldProcess?: boolean;
    dispAction?: Action;
  }>;

  addDeps(additionalDeps: Partial<Dependency>): void;

  addLogic(
    newLogics: Logic<State, any, any, Dependency, any>[]
  ): { logicCount: number };

  mergeNewLogic(
    newLogics: Logic<State, any, any, Dependency, any>[]
  ): { logicCount: number };

  replaceLogic(
    logics: Logic<State, any, any, Dependency, any>[]
  ): { logicCount: number };

  whenComplete<Fn extends Function>(callback?: Fn): Promise<Fn>;
}

/* ----- createLogicMiddleware ----- */

export function createLogicMiddleware<
  State extends object = {},
  Dependency extends object = {},
  Context extends Object = undefined,
  Type extends string = string
>(
  logics?: Logic<State, any, any, Dependency, Context, Type>[],
  deps?: Dependency
): LogicMiddleware<State, Dependency, Context, Type>;

export namespace CreateLogicMiddleware {
  export interface Store<State> {
    dispatch?: (action?: Action) => Action;
    getState?: () => State;
  }

  export type Next = (next: Function) => ActionCreator;

  export type ActionCreator = (action?: ArgumentAction) => Action;
}

// ---------------------------------------- //

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

import { Observable, Subject } from 'rxjs';

import { Middleware } from 'redux';

import { ArgumentAction, Action, ActionBasis, StandardAction } from './action';
import { Object, Override } from './utilities';

//
// LOGIC
//

/*                     *    *    *    *                       *
 | State is the type of the state stored in redux             |
 | Payload is the type of the payload of the handled action   |
 | Meta is the type of the meta object of the handled action  |
 | Dependency is the type of depObj excluding getState/action |
 | Context is the type of the ctx object                      |
 | Type is the type of the handled action                     |
 *                     *    *    *    *                       */

export type Logic<
  State extends object = {},
  Payload extends Object = undefined,
  Meta extends Object = undefined,
  Dependency extends object = {},
  Context extends Object = undefined,
  Type extends string = string
> = Override<
  CreateLogic.Config<
    State,
    Action<Type, Payload, Meta>,
    Dependency,
    Context,
    Type
  >,
  {
    name: string;
    type: string;
    cancelType: string;
  }
>;

/* ----- createLogic ----- */

export declare const createLogic: CreateLogic;

export interface CreateLogic {
  // full createLogic declaration
  <
    State extends object,
    Payload extends Object = undefined,
    Meta extends Object = undefined,
    Dependency extends object = {},
    Context extends Object = undefined,
    Type extends string = string,
    Action extends StandardAction<Type, Payload, Meta> = StandardAction<Type, Payload, Meta>,
  >(
    config: CreateLogic.Config<
      State,
      Action,
      Dependency,
      Context,
      Type
    >
  ): Logic<State, Payload, Meta, Dependency, Context, Type>;

  // createLogic wihout context
  <
    State extends object,
    Payload extends Object = undefined,
    Meta extends Object = undefined,
    Dependency extends object = {},
    Type extends string = string,
    Action extends StandardAction<Type, Payload, Meta> = StandardAction<Type, Payload, Meta>,
  >(
    config: CreateLogic.Config<
      State,
      Action,
      Dependency,
      undefined,
      Type
    >
  ): Logic<State, Payload, Meta, Dependency, undefined, Type>;

  // createLogic wihout payload and meta
  <
    State extends object,
    Dependency extends object = {},
    Context extends Object = undefined,
    Type extends string = string,
    Action extends StandardAction<Type> = StandardAction<Type>
  >(
    config: CreateLogic.Config<State, Action, Dependency, Context, Type>
  ): Logic<State, undefined, undefined, Dependency, Context, Type>;

  // createLogic with State and Type only
  <State extends object, Type extends string = string, Action extends StandardAction<Type> = StandardAction<Type>>(
    config: CreateLogic.Config<State, Action, {}, undefined, Type>
  ): Logic<State, undefined, undefined, {}, undefined, Type>;

  // createLogic with State, Dependency and Type only
  <
    State extends object,
    Dependency extends object = {},
    Type extends string = string,
    Action extends StandardAction<Type> = StandardAction<Type>
  >(
    config: CreateLogic.Config<State, Action, Dependency, undefined, Type>
  ): Logic<State, undefined, undefined, Dependency, undefined, Type>;
}

export namespace CreateLogic {
  export type Config<
    State extends object,
    Action extends StandardAction,
    Dependency extends object,
    Context extends Object,
    Type extends string
  > = Config.Base<State, Action, Type> &
    (
      | Config.Validate<State, Action, Dependency, Context>
      | Config.Transform<State, Action, Dependency, Context>) &
    (Config.Process<State, Action, Dependency, Context>);

  export namespace Config {
    /* ----- common ----- */

    export type DepObj<State, Action, Dependency> = Dependency & {
      getState(): State;
      action: Action;
      action$: Observable<Action>;
    };

    export type ActionCreatorType<Action extends StandardAction> = {
      (payload: PayloadExtractor<Action>): Action;
      toString(): string;
    }

    export type PrimitiveType<Type extends string | symbol, InputPayload> =
      | Type
      | RegExp
      | Function;

    export type TypeMatcher<
      Type extends string | symbol,
      Payload extends Object
    > = PrimitiveType<Type, Payload> | PrimitiveType<Type, Payload>[];

    export type Pass<Action extends ActionBasis, Context extends Object> = (
      action: ArgumentAction &
        (Context extends undefined
          ? {}
          : (Context extends undefined ? { ctx?: Context } : { ctx: Context })),
      options?: {
        useDispatch: boolean | 'auto';
      }
    ) => void;

    export interface Base<
      State extends object,
      Action extends StandardAction,
      Type extends string
    > {
      name?: string | Function;
      type: TypeMatcher<Type, PayloadExtractor<Action>> | ActionCreatorType<Action>;
      cancelType?: TypeMatcher<string, PayloadExtractor<Action>>;
      latest?: boolean;
      debounce?: number;
      throttle?: number;
      warnTimeout?: number;
    }

    // ---------------------------------------- //

    /* ----- validate ----- */

    interface Validate<
      State,
      Action extends ActionBasis,
      Dependency extends object,
      Context extends Object
    > {
      validate?: Validate.Hook<State, Action, Dependency, Context>;
    }

    export namespace Validate {
      export type Hook<
        State,
        Action extends ActionBasis,
        Dependency extends object,
        Context extends Object = undefined
      > = (
        depObj: DepObj<State, Action, Dependency>,
        allow: Pass<Action, Context>,
        reject: Pass<Action, Context>
      ) => void;
    }

    // ---------------------------------------- //

    /* ----- transform ----- */

    interface Transform<
      State,
      Action extends ActionBasis,
      Dependency extends object,
      Context extends Object
    > {
      transform?: Transform.Hook<State, Action, Dependency, Context>;
    }

    export namespace Transform {
      export type Hook<
        State,
        Action extends ActionBasis,
        Dependency extends object,
        Context extends Object = undefined
      > = (
        depObj: DepObj<State, Action, Dependency>,
        next: Pass<Action, Context>,
        reject?: Pass<Action, Context>
      ) => void;
    }

    // ---------------------------------------- //

    /* ----- process ----- */

    type ActionCreator<
      InputPayload extends Object
    > = InputPayload extends undefined
      ? (payload?: InputPayload) => StandardAction<string, any>
      : (InputPayload extends Error
          ? (error?: Error) => Action<string, any>
          : (payload?: InputPayload) => Action<string, any>);

    type PayloadExtractor<
      Action extends StandardAction
    > = Action extends StandardAction<infer Type, infer Payload>
      ? Payload
      : undefined;

    export interface Process<
      State extends object,
      Action extends StandardAction<string>,
      Dependency extends object,
      Context extends Object = undefined
    > {
      processOptions?: Process.Options<Action>;
      process?: Process.Hook<State, Action, Dependency, Context>;
    }

    export namespace Process {
      export interface Options<Action extends StandardAction> {
        dispatchReturn?: boolean;
        dispatchMultiple?: boolean;
        successType?: string | ActionCreator<PayloadExtractor<Action>>;
        failType?: string | ActionCreator<Error>;
      }

      export type DepObj<
        State extends object,
        Action extends StandardAction,
        Dependency extends object,
        Context extends Object = undefined
      > = Config.DepObj<State, Action, Dependency> & {
        cancelled$: Subject<void>;
        ctx: Context;
      };

      export type Hook<
        State extends object,
        Action extends StandardAction,
        Dependency extends object,
        Context extends Object = undefined
      > = ((
        depObj: Process.DepObj<State, Action, Dependency, Context>,
        dispatch: (action: ArgumentAction) => void,
        done: () => void
      ) => void);
    }

    // ---------------------------------------- //
  }
}

// ---------------------------------------- //

/* ----- configureLogic ----- */

export function configureLogic(options: { warnTimeout?: number }): void;

// ---------------------------------------- //

/**
 * Attempt to create typings so we can try out redux-logic in TypeScript.
 *
 * See https://github.com/jeffbski/redux-logic
 *
 */

import {Middleware} from "redux";

/**
 * Alias for the allowed types for the type parameter for
 * the FSA's type field
 */
type ActionType = string | symbol;

/**
 * An Action type that represents a Redux action type that
 * conforms to the Flux Standard Action pattern.
 * <p>
 * See https://github.com/acdlite/flux-standard-action
 * <p>
 * We could use the one defined in that project, but the typings appear to be broken
 * At least, they require specifying every value, even though they are documented as optional.
 * <p>
 * We include a copy here with all of properties except 'type' declared as optional.
 */
export interface FSA<P, M> {
  /**
   * The `type` of an action identifies to the consumer the nature of the action that has occurred.
   * Two actions with the same `type` MUST be strictly equivalent (using `===`)
   */
  type: ActionType;

  /**
   * The optional `payload` property MAY be any type of value.
   * It represents the payload of the action.
   * Any information about the action that is not the type or status of the action should be part of the `payload` field.
   * By convention, if `error` is `true`, the `payload` SHOULD be an error object.
   * This is akin to rejecting a promise with an error object.
   */
  payload?: P;

  /**
   * The optional `error` property MAY be set to true if the action represents an error.
   * An action whose `error` is true is analogous to a rejected Promise.
   * By convention, the `payload` SHOULD be an error object.
   * If `error` has any other value besides `true`, including `undefined`, the action MUST NOT be interpreted as an error.
   */
  error?: boolean;

  /**
   * The optional `meta` property MAY be any type of value.
   * It is intended for any extra information that is not part of the payload.
   */
  meta?: M;
}


/**
 * This is the type signature for the 'action' parameter passed into
 * the various callbacks: allow/next, reject, dispatch
 *
 * TODO Can this be constrained at all?
 */
type LogicAction = any;

/**
 * This is the type signature for the value that can be passed to the
 * LogicDispatch callback provided to the process hook.
 *
 * TODO Right now this is the same as LogicAction, which is any
 * TODO If we can constrain LogicAction more than any, then we
 * TODO Might need to reconsider the type signature here.
 */
type DispatchableAction = LogicAction;

/**
 * The shape of the object passed as the first parameter to all of the hook functions: validate, transform, process
 *
 * If you define any additional properties when creating the middleware, they will also be included. They are
 * declared in the function type signatures below using the generic type parameter D
 */
interface LogicHookParams {
  getState: () => any;

  action: LogicAction;

  ctx: object;

  // TODO cancelled$ observable - no idea yet on what its type signature should be
}

/**
 * This is primitive type of a value that
 * can be passed for the 'type' or 'cancelType' fields
 * of the LogicOptions
 *
 * TODO Extend to include "redux-actions" functions
 */
type ActionTypePrimitive = string;

/**
 * The is the actual type signature for the 'type' and 'cancelType' fields
 * of LogicOptions
 */
type ActionTypeMatcher = ActionTypePrimitive | ActionTypePrimitive[];

/**
 * Optional options for controlling how redux-logic should handle
 * the Action passed to allow/next/reject.
 * <p>
 * Defaults to { useDispatch: 'auto' }
 */
interface AllowRejectOptions {
  useDispatch: boolean | string;
}

/*
 * These are the type signatures for each of the callbacks that the middleware
 * passes to your hook methods.
 *
 */

type LogicAllow = (action: LogicAction, options?: AllowRejectOptions) => void;

type LogicReject = (action: LogicAction, options?: AllowRejectOptions) => void;

type LogicDispatch = (action: DispatchableAction) => DispatchableAction;

type LogicDone = () => void;

/*
 * Now we have all of the types needed to go ahead and define hook functions
 */

type TransformHook = <D>(depObj: LogicHookParams & D, next: LogicAllow) => void;

type ValidateHook = <D>(depObj: LogicHookParams & D, allow: LogicAllow, reject: LogicReject) => void;

type ProcessHook = <D>(depObj: LogicHookParams & D, dispatch: LogicDispatch, done: LogicDone) => any;


/**
 * Type signature for an action creator function which can be used
 * as the value of the 'successType' property of ProcessOptions
 */
type ActionCreator = <P, M>(payload?: P) => FSA<P, M>;

interface ProcessOptions {
  dispatchReturn?: boolean;

  dispatchMultiple?: boolean;

  successType?: string | ActionCreator;

  failType?: string | ActionCreator;
}

interface Logic {
  name?: string;

  type: ActionTypeMatcher;

  cancelType?: ActionTypeMatcher;

  latest?: boolean;

  debounce?: number;

  throttling?: number;

  warnTimeout?: number;

  validate?: ValidateHook;

  transform?: TransformHook;

  processOptions?: ProcessOptions;

  process?: ProcessHook;
}

type LogicCreator = (config: Logic) => Logic;

declare const createLogic: LogicCreator;


interface LogicMiddleware extends Middleware {
  addDeps: <D>(additionalDeps: D) => void;

  addLogic: (newLogics: Logic[]) => void;

  mergeNewLogic: (newLogics: Logic[]) => void;

  replaceLogic: (logics: Logic[]) => void;

  // TODO Add monitor$ Observable

  // TODO Figure out where whenComplete() comes from and what its type signature should be
}

type LogicMiddlewareCreator = <D>(logics: Logic[], deps?: D) => LogicMiddleware;

declare const createLogicMiddleware: LogicMiddlewareCreator;

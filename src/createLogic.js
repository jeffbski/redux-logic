import { stringifyType } from './utils';

const allowedOptions = [
  'name',
  'type',
  'cancelType',
  'latest',
  'debounce',
  'throttle',
  'validate',
  'transform',
  'process',
  'processOptions',
  'warnTimeout'
];

const allowedProcessOptions = [
  'dispatchReturn',
  'dispatchMultiple',
  'successType',
  'failType',
];

const NODE_ENV = (typeof window  === 'undefined' && process && process.env && process.env.NODE_ENV) ? process.env.NODE_ENV : '';

const defaultOptions = {
  warnTimeout: 60000,
  latest: false,
  debounce: 0,
  throttle: 0,
};

const globallyConfigurableOptions = ['warnTimeout'];

/**
   Configure the default `createLogic` options. Note that changing these values
   will not affect `Logic` instances that have already been instantiated.

   @param {object}  options object defining default values to be used when creating `Logic`
     instances. The following options may be set globally:
        - warnTimeout

     See the `createLogic` API documentation for a description of these options.

   @returns {undefined}

   @example

   ```
   import { configureLogic, createLogic } from 'redux-logic';

   configureLogic({ warnTimeout: 10000 })

   // These will both timeout after 10 seconds instead of the library default of
   // 1 minute.
   const logicOne = createLogic({
      type: 'ACTION_ONE',
   })
   const logicTwo = createLogic({
      type: 'ACTION_TWO',
   })
   ```
 */
export const configureLogic = (options = {}) => {
  const invalidOptions = getInvalidOptions(options, globallyConfigurableOptions);
  if (invalidOptions.length) {
    throw new Error(`${invalidOptions} are not globally configurable options.`);
  }

  Object.keys(options)
    .forEach((option) => { defaultOptions[option] = options[option]; });
};

/**
   Validate and augment logic object to be used in logicMiddleware.
   The returned object has the same structure as the supplied
   logicOptions argument but it will have been validated and defaults
   will be applied

   @param {object} logicOptions object defining logic operation
   @param {string} logicOptions.name optional string name, defaults
     to generated name from type and idx
   @param {string | regex | function | array} logicOptions.type action
     type(s) that this logic is used for. A string '*' indicates that
     it applies to all types, otherwise strings are used for exact match.
     A regex can also be used to match. If a function is supplied like
     a redux-actions action function, then it will use call its toString()
     method to get the associated action type. An array of any of these
     can be supplied to extend match to more types.
   @param {string | regex | function | array} logicOptions.cancelType
     action type(s) that will cause a cancellation. String, regex, fn,
     array are used similar to how the logicOptions.type works.
     Cancellation will automatically prevent dispatches from being used
     regardless of when the original logic finishes. Additionally a
     cancellation$ observable is available to logic to detect
     cancellation and perform any manual cleanup.
   @param {boolean} logicOptions.latest enables takeLatest which cancels
     previous when a newer one comes in, default false
   @param {number} logicOptions.debounce milliseconds to perform
     debouncing, cannot be used with latest, default 0 (disabled)
   @param {number} logicOptions.throttle milliseconds to perform
     throttling, cannot be used with latest, default 0 (disabled)
   @param {function} logicOptions.validate hook that will be executed
     before an action has been sent to other logic, middleware, and the
     reducers. Must call one of the provided callback functions allow or
     reject with an action to signal completion. Expected to be called
     exactly once. Pass undefined as an object to forward nothing.
     Calling reject prevents process hook from being run. Defaults to
     an identity fn which allows the original action.
   @param {function} logicOptions.transform hook that will be executed
     before an action has been sent to other logic, middleware, and the
     reducers. This is an alias for the validate hook. Call the
     provided callback function `next` (or `reject`) to
     signal completion. Expected to be called exactly once. Pass
     undefined as an object to forward nothing. Defaults to an identity
     transform which forwards the original action.
   @param {function} logicOptions.process hook that will be invoked
     after the original action (or that returned by validate/transform
     step) has been forwarded to other logic, middleware, and reducers.
     This hook will not be run if the validate/transform hook called
     reject. This hook is ideal for any additional processing or async
     fetching. The fn signature is `process(deps, ?dispatch, ?done)`
     where dispatch and done are optional and if included in the
     the signature will change the dispatch mode:
     1. Neither dispatch, nor done - dispatches the returned/resolved val
     2. Only dispatch - single dispatch mode, call dispatch exactly once (deprecated)
     3. Both dispatch and done - multi-dispatch mode, call done when finished
     Dispatch may be called with undefined when nothing needs to be
     dispatched. Multiple dispatches may be made if including the done or
     simply by dispatching an observable.
     More details on dispatching modes are in the advanced API docs
   @param {object} logicOptions.processOptions options influencing
     process hook, default {}
   @param {boolean} logicOptions.processOptions.dispatchReturn dispatch
     the return value or resolved/next promise/observable, default is
     false when dispatch is included in process fn signature
   @param {boolean} logicOptions.processOptions.dispatchMultiple
     multi-dispatch mode is enabled and continues until done is called
     or cancelled. The default is false unless the done cb is included
     in the process fn signature.
   @param {string|function} logicOptions.processOptions.successType
     action type or action creator fn, use value as payload
   @param {string|function} logicOptions.processOptions.failType
     action type or action creator fn, use value as payload
   @param {number} logicOptions.warnTimeout In non-production environment
     a console.error message will be logged if logic doesn't complete
     before this timeout in ms fires. Set to 0 to disable. Defaults to
     60000 (one minute)
   @returns {object} validated logic object which can be used in
     logicMiddleware contains the same properties as logicOptions but
     has defaults applied.
 */
export default function createLogic(logicOptions = {}) {
  const invalidOptions = getInvalidOptions(logicOptions, allowedOptions);
  if (invalidOptions.length) {
    throw new Error(`unknown or misspelled option(s): ${invalidOptions}`);
  }

  const { name, type, cancelType,
          warnTimeout = defaultOptions.warnTimeout,
          latest = defaultOptions.latest,
          debounce = defaultOptions.debounce,
          throttle = defaultOptions.throttle,
          validate, transform, process, // these can be falsy
          processOptions = {} } = logicOptions;

  if (!type) {
    throw new Error('type is required, use \'*\' to match all actions');
  }

  if (type === 'undefined') {
    throw new Error('type is a string "undefined", check the logicOptions type field for a stringified undefined value');
  }

  if (validate && transform) {
    throw new Error('logic cannot define both the validate and transform hooks they are aliases');
  }

  if (typeof processOptions.warnTimeout !== 'undefined') {
    throw new Error('warnTimeout is a top level createLogic option, not a processOptions option');
  }

  const invalidProcessOptions = getInvalidOptions(processOptions, allowedProcessOptions);
  if (invalidProcessOptions.length) {
    throw new Error(`unknown or misspelled processOption(s): ${invalidProcessOptions}`);
  }

  if (NODE_ENV !== 'production' &&
      typeof processOptions.dispatchMultiple !== 'undefined' &&
      warnTimeout !== 0) {
    // eslint-disable-next-line no-console
    console.error(`warning: in logic for type(s): ${stringifyType(type)} - dispatchMultiple is always true in next version. For non-ending logic, set warnTimeout to 0`);
  }

  const processLength = (process) ? process.length : 0;

  // use process fn signature to determine some processOption defaults
  // for dispatchReturn and dispatchMultiple
  switch (processLength) {
    case 0: // process() - dispatchReturn
    case 1: // process(deps) - dispatchReturn
      setIfUndefined(processOptions, 'dispatchReturn', true);
      break;
    case 2: // process(deps, dispatch) - single dispatch (deprecated)
      if (NODE_ENV !== 'production' &&
          !processOptions.dispatchMultiple
          && warnTimeout !== 0) {
        // eslint-disable-next-line no-console
        console.error(`warning: in logic for type(s): ${stringifyType(type)} - single-dispatch mode is deprecated, call done when finished dispatching. For non-ending logic, set warnTimeout: 0`);
      }
      // nothing to do, defaults are fine
      break;
    case 3: // process(deps, dispatch, done) - multi-dispatch
    default: // allow for additional params to come later
      setIfUndefined(processOptions, 'dispatchMultiple', true);
      break;
  }

  return {
    name: typeToStrFns(name),
    type: typeToStrFns(type),
    cancelType: typeToStrFns(cancelType),
    latest,
    debounce,
    throttle,
    validate,
    transform,
    process,
    processOptions,
    warnTimeout
  };
}

function getInvalidOptions(options, validOptions) {
  return Object.keys(options)
    .filter(k => validOptions.indexOf(k) === -1);
}

/* if type is a fn call toString() to get type, redux-actions
  if array, then check members */
function typeToStrFns(type) {
  if (Array.isArray(type)) { return type.map(x => typeToStrFns(x)); }
  return (typeof type === 'function') ?
    type.toString() :
    type;
}

function setIfUndefined(obj, propName, propValue) {
  if (typeof obj[propName] === 'undefined') {
    // eslint-disable-next-line no-param-reassign
    obj[propName] = propValue;
  }
}

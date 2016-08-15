
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
  'processOptions'
];

const allowedProcessOptions = [
  'dispatchReturn',
  'successType',
  'failType'
];

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
     fetching and then to call dispatch once with the results. Dispatch
     is expected to be called exactly once. You can call with undefined
     if you do not need to dispatch anything. To make multiple
     dispatches you can dispatch an observable or call with the option
     `{ allowMore: true }` to allow any number of calls, see advanced
     section of API docs for details.
   @param {object} logicOptions.processOptions options influencing
     process hook, default {}
   @param {boolean} logicOptions.processOptions.dispatchReturn dispatch
     the return value or resolved/next promise/observable, default false
   @param {string|function} logicOptions.processOptions.successType
     action type or action creator fn, use value as payload
   @param {string|function} logicOptions.processOptions.failType
     action type or action creator fn, use value as payload
   @returns {object} validated logic object which can be used in
     logicMiddleware contains the same properties as logicOptions but
     has defaults applied.
 */
export default function createLogic(logicOptions = {}) {
  const invalidOptions = Object.keys(logicOptions)
        .filter(k => allowedOptions.indexOf(k) === -1);
  if (invalidOptions.length) {
    throw new Error(`unknown or misspelled option(s): ${invalidOptions}`);
  }

  const { name, type, cancelType,
          latest = false, debounce = 0, throttle = 0,
          validate, transform, process = emptyProcess,
          processOptions = {} } = logicOptions;

  if (!type) {
    throw new Error('type is required, use \'*\' to match all actions');
  }

  if (latest && (debounce || throttle)) {
    throw new Error('logic cannot use both latest and debounce/throttle');
  }

  if (validate && transform) {
    throw new Error('logic cannot define both the validate and transform hooks they are aliases');
  }

  const invalidProcessOptions = Object.keys(processOptions)
        .filter(k => allowedProcessOptions.indexOf(k) === -1);
  if (invalidProcessOptions.length) {
    throw new Error(`unknown or misspelled processOption(s): ${invalidProcessOptions}`);
  }

  const validateDefaulted = (!validate && !transform) ?
        identityValidation :
        validate;

  return {
    name: typeToStrFns(name),
    type: typeToStrFns(type),
    cancelType: typeToStrFns(cancelType),
    latest,
    debounce,
    throttle,
    validate: validateDefaulted,
    transform,
    process,
    processOptions
  };
}

/* if type is a fn call toString() to get type, redux-actions
  if array, then check members */
function typeToStrFns(type) {
  if (Array.isArray(type)) { return type.map(x => typeToStrFns(x)); }
  return (typeof type === 'function') ?
    type.toString() :
    type;
}

function identityValidation({ action }, allow /* , reject */) {
  allow(action);
}

function emptyProcess(_, dispatch) {
  dispatch();
}

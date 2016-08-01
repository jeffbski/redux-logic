export default function createLogic({ name, type, cancelType,
                                     latest = false,
                                     debounce = 0,
                                     throttle = 0,
                                     validate = identityValidation,
                                     transform = identityTransform,
                                     process = emptyProcess }) {
  if (!type) {
    throw new Error('type is required, use \'*\' to match all actions');
  }

  if (latest && (debounce || throttle)) {
    throw new Error('logic cannot use latest and debounce/throttle');
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
    process
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

function identityTransform({ action }, next) {
  return next(action);
}

function emptyProcess(_, dispatch) {
  dispatch();
}

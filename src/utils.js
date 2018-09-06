export function identityFn(x) { return x; }

// Symbols and Arrays containing Symbols cannot be interpolated in template strings,
// they must be explicitly converted with toString()
// eslint-disable-next-line import/prefer-default-export
export function stringifyType(type) {
  return Array.isArray(type) ?
         type.map(type => type.toString()) :
         type.toString();
}

// we want to know that this was from intercept (validate/transform)
// so that we don't apply any processOptions wrapping to it
export function wrapActionForIntercept(act) {
  /* istanbul ignore if  */
  if (!act) { return act; }
  return {
    __interceptAction: act
  };
}

export function isInterceptAction(act) {
  // eslint-disable-next-line no-underscore-dangle
  return act && act.__interceptAction;
}

export function unwrapInterceptAction(act) {
  // eslint-disable-next-line no-underscore-dangle
  return act.__interceptAction;
}

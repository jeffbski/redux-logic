import { Observable, merge } from 'rxjs';
import { debounceTime, filter, map, mergeMap, share, throttleTime } from 'rxjs/operators';
import createLogicAction$ from './createLogicAction$';

const identityFn = x => x;

export default function logicWrapper(logic, store, deps, monitor$) {
  const { type, cancelType, latest, debounce, throttle } = logic;

  // cancel on cancelType or if take latest specified
  const cancelTypes = []
    .concat((type && latest) ? type : [])
    .concat(cancelType || []);

  return function wrappedLogic(actionIn$) {
    // we want to share the same copy amongst all here
    const action$ = actionIn$.pipe(share());

    const cancel$ = (cancelTypes.length) ?
      action$.pipe(
        filter(action => matchesType(cancelTypes, action.type))
      ) : Observable.create((/* obs */) => {}); // shouldn't complete

    // types that don't match will bypass this logic
    const nonMatchingAction$ = action$.pipe(
      filter(action => !matchesType(type, action.type))
    );

    const matchingAction$ = action$.pipe(
      filter(action => matchesType(type, action.type)),
      (debounce) ? debounceTime(debounce) : map(identityFn),
      (throttle) ? throttleTime(throttle) : map(identityFn),
      mergeMap(action =>
        createLogicAction$({ action, logic, store, deps,
          cancel$, monitor$ }))
    );

    return merge(
      nonMatchingAction$,
      matchingAction$
    );
  };
}

function matchesType(tStrArrRe, type) {
  /* istanbul ignore if  */
  if (!tStrArrRe) { return false; } // nothing matches none
  if (typeof tStrArrRe === 'symbol') {
    return (tStrArrRe === type);
  }
  if (typeof tStrArrRe === 'string') {
    return (tStrArrRe === type || tStrArrRe === '*');
  }
  if (Array.isArray(tStrArrRe)) {
    return tStrArrRe.some(x => matchesType(x, type));
  }
  // else assume it is a RegExp
  return tStrArrRe.test(type);
}

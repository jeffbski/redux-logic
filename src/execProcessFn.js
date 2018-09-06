import { throwError } from 'rxjs';

export default function execProcessFn({depObj, dispatch, dispatch$,
  dispatchReturn, done, name, processFn }) {
  try {
    const retValue = processFn(depObj, dispatch, done);
    if (dispatchReturn) { // processOption.dispatchReturn true
      // returning undefined won't dispatch
      if (typeof retValue === 'undefined') {
        dispatch$.complete();
      } else { // defined return value, dispatch
        dispatch(retValue); // handles observables, promises, ...
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`unhandled exception in logic named: ${name}`, err);
    // wrap in observable since might not be an error object
    dispatch(throwError(err));
  }
}

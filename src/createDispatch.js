import isPromise from 'is-promise';
import { Subject, from, of, throwError, isObservable } from 'rxjs';
import { defaultIfEmpty, tap, filter, map, mergeAll, takeUntil} from 'rxjs/operators';
import { identityFn, isInterceptAction, unwrapInterceptAction } from './utils';

const UNHANDLED_LOGIC_ERROR = 'UNHANDLED_LOGIC_ERROR';

// returns { dispatch, dispatch$, done };
export default function createDispatch({ action, cancel$, cancelled$, logic, monitor$, store }) {
  const { name, processOptions: { dispatchMultiple, successType, failType }} = logic;

  const dispatchOps = [
    mergeAll(),
    (cancel$) ? takeUntil(cancel$) : null, // only takeUntil if cancel or latest
    tap(
      mapToActionAndDispatch, // next
      mapErrorToActionAndDispatch // error
    )
  ].filter(identityFn);

  const dispatch$ = new Subject();
  dispatch$.pipe(...dispatchOps).subscribe({
    error: (/* err */) => {
      monitor$.next({ action, name, op: 'end' });
      // signalling complete here since error was dispatched
      // accordingly, otherwise if we were to signal an error here
      // then cancelled$ subscriptions would have to specifically
      // handle error in subscribe otherwise it will throw. So
      // it doesn't seem that it is worth it.
      cancelled$.complete();
      cancelled$.unsubscribe();
    },
    complete: () => {
      monitor$.next({ action, name, op: 'end' });
      cancelled$.complete();
      cancelled$.unsubscribe();
    }
  });

  function storeDispatch(act) {
    monitor$.next({ action, dispAction: act, op: 'dispatch' });
    return store.dispatch(act);
  }

  function mapToActionAndDispatch(actionOrValue) {
    const act =
      (isInterceptAction(actionOrValue)) ? unwrapInterceptAction(actionOrValue) :
        (successType) ? mapToAction(successType, actionOrValue, false) :
        actionOrValue;
    if (act) {
      storeDispatch(act);
    }
  }

  /* eslint-disable consistent-return */
  function mapErrorToActionAndDispatch(actionOrValue) {
    // action dispatched from intercept needs to be unwrapped and sent as is
    /* istanbul ignore if  */
    if (isInterceptAction(actionOrValue)) {
      const interceptAction = unwrapInterceptAction(actionOrValue);
      return storeDispatch(interceptAction);
    }

    if (failType) {
      // we have a failType, if truthy result we will use it
      const act = mapToAction(failType, actionOrValue, true);
      if (act) {
        return storeDispatch(act);
      }
      return; // falsey result from failType, no dispatch
    }

    // no failType so must wrap values with no type
    if (actionOrValue instanceof Error) {
      const act =
        (actionOrValue.type) ? actionOrValue : // has type
          {
            type: UNHANDLED_LOGIC_ERROR,
            payload: actionOrValue,
            error: true
          };
      return storeDispatch(act);
    }

    // dispatch objects or functions as is
    const typeOfValue = typeof actionOrValue;
    if (actionOrValue && ( // not null and is object | fn
      typeOfValue === 'object' || typeOfValue === 'function')) {
      return storeDispatch(actionOrValue);
    }

    // wasn't an error, obj, or fn, so we will wrap in unhandled
    storeDispatch({
      type: UNHANDLED_LOGIC_ERROR,
      payload: actionOrValue,
      error: true
    });
  }
  /* eslint-enable consistent-return */

  function mapToAction(type, payload, err) {
    if (typeof type === 'function') { // action creator fn
      return type(payload);
    }
    const act = { type, payload };
    if (err) { act.error = true; }
    return act;
  }

  // allowMore is now deprecated in favor of variable process arity
  // which sets processOptions.dispatchMultiple = true then
  // expects done() cb to be called to end
  // Might still be needed for internal use so keeping it for now
  const DispatchDefaults = {
    allowMore: false
  };

  function dispatch(act, options = {}) {
    const { allowMore } = applyDispatchDefaults(options);
    if (typeof act !== 'undefined') { // ignore empty action
      dispatch$.next( // create obs for mergeAll
        // eslint-disable-next-line no-nested-ternary
        (isObservable(act)) ? act :
        (isPromise(act)) ? from(act) :
        (act instanceof Error) ? throwError(act) :
        of(act)
      );
    }
    if (!(dispatchMultiple || allowMore)) { dispatch$.complete(); }
    return act;
  }

  function applyDispatchDefaults(options) {
    return {
      ...DispatchDefaults,
      ...options
    };
  }

  function done() {
    dispatch$.complete();
  }

  return {
    dispatch,
    dispatch$,
    done
  };
}

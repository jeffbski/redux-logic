import isObservable from 'is-observable';
import isPromise from 'is-promise';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { asap } from 'rxjs/scheduler/asap';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeAll';
import 'rxjs/add/operator/observeOn';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/takeUntil';

const UNHANDLED_LOGIC_ERROR = 'UNHANDLED_LOGIC_ERROR';

const debug = (/* ...args */) => {};

export default function createLogicAction$({ action, logic, store, deps, cancel$ }) {
  const { getState } = store;
  const { name, process: processFn,
          processOptions: { dispatchReturn,
                            successType, failType } } = logic;
  const validtrans = logic.validate || logic.transform; // aliases

  debug('createLogicAction$', name, action);

  const logicAction$ = Observable.create(logicActionObs => {
    // create notification subject for process which we dispose of
    // when take(1) or when we are done dispatching
    const cancelled$ = (new Subject())
          .take(1);
    cancel$.subscribe(cancelled$); // connect cancelled$ to cancel$

    const dispatch$ = (new Subject())
          .mergeAll()
          .takeUntil(cancel$);
    dispatch$.subscribe({
      next: mapAndDispatch,
      complete: () => {
        cancelled$.complete();
        cancelled$.unsubscribe();
      }
    });

    /* eslint-disable consistent-return */
    function mapAndDispatch(actionOrValue) {
      if (typeof actionOrValue === 'undefined') { return; }
      if (failType) {
        if (actionOrValue.useFailType) {
          return store.dispatch(mapToAction(failType, actionOrValue.value, true));
        }
        if (actionOrValue instanceof Error) {
          return store.dispatch(mapToAction(failType, actionOrValue, true));
        }
      }
      // failType not defined, but we have an error with no action type
      // let's console.error it and emit as an UNHANDLED_LOGIC_ERROR
      if (actionOrValue instanceof Error && !actionOrValue.type) {
        // eslint-disable-next-line no-console
        console.error(`unhandled exception in logic named: ${logic.name}`, actionOrValue);
        return store.dispatch(mapToAction(UNHANDLED_LOGIC_ERROR,
                                          actionOrValue,
                                          true));
      }

      const act = (successType) ?
            mapToAction(successType, actionOrValue, false) :
            actionOrValue;
      return store.dispatch(act);
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


    const DispatchDefaults = {
      allowMore: false
    };

    function dispatch(act, options = DispatchDefaults) {
      const { allowMore } = applyDispatchDefaults(options);
      if (act) { // ignore empty action
        dispatch$.next( // create obs for mergeAll
          (isObservable(act)) ?
            act :
            Observable.of(act)
        );
      }
      if (!allowMore) { dispatch$.complete(); }
      return act;
    }

    function applyDispatchDefaults(options) {
      return {
        ...DispatchDefaults,
        ...options
      };
    }

    // passed into each execution phase hook as first argument
    const depObj = {
      ...deps,
      cancelled$,
      ctx: {}, // for sharing data between hooks
      getState,
      action
    };

    function shouldDispatch(act, useDispatch) {
      if (!act) { return false; }
      if (useDispatch === 'auto') { // dispatch on diff type
        return (act.type !== action.type);
      }
      return (useDispatch); // otherwise forced truthy/falsy
    }

    const AllowRejectNextDefaults = {
      useDispatch: 'auto'
    };

    function applyAllowRejectNextDefaults(options) {
      return {
        ...AllowRejectNextDefaults,
        ...options
      };
    }

    function allow(act, options = AllowRejectNextDefaults) {
      handleNextOrDispatch(true, act, options);
    }

    function reject(act, options = AllowRejectNextDefaults) {
      handleNextOrDispatch(false, act, options);
    }

    function handleNextOrDispatch(shouldProcess, act, options) {
      const { useDispatch } = applyAllowRejectNextDefaults(options);
      if (shouldDispatch(act, useDispatch)) {
        dispatch(act, { allowMore: true }); // will be completed later
        logicActionObs.complete();
      } else { // normal next
        postIfDefinedOrComplete(act, logicActionObs);
      }
      // unless rejected, we will process even if allow/next dispatched
      if (shouldProcess) { // processing, was an accept
        // delay process slightly so state can be updated
        Observable.of(true)
          .observeOn(asap)
          .subscribe(() => {
            // if action provided is empty, give process orig
            depObj.action = act || action;
            try {
              const retValue = processFn(depObj, dispatch);
              if (dispatchReturn) { // processOption.dispatchReturn true
                handleDispatchReturn(retValue);
              }
            } catch (err) {
              dispatch(err);
            }
          });
      } else { // not processing, must have been a reject
        dispatch$.complete();
      }
    }

    function handleDispatchReturn(retValue) {
      if (isPromise(retValue) || isObservable(retValue)) {
        dispatch(
          // convert promise to observable
          // catch any errors and rejects, wrap them
          Observable
            .from(retValue)
            .catch(err => { // eslint-disable-line arrow-body-style
              return (failType) ?
                     // wrap this value so we can apply failType later
                     Observable.of({ useFailType: true, value: err }) :
                     Observable.of(err);
            })
        );
      } else {
        dispatch(retValue);
      }
    }

    /* post if defined, otherwise complete */
    function postIfDefinedOrComplete(act, act$) {
      if (act) {
        act$.next(act);
      } else {
        act$.complete();
      }
    }

    // start use of the action
    function start() {
      validtrans(depObj, allow, reject);
    }

    start();
  })
  .takeUntil(cancel$)
  .take(1);

  return logicAction$;
}

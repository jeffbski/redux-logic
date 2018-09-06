import isPromise from 'is-promise';
import { Observable, Subject } from 'rxjs';
import { take, takeUntil} from 'rxjs/operators';
import { identityFn, wrapActionForIntercept } from './utils';
import createDepObject from './createDepObject';
import execProcessFn from './execProcessFn';
import createDispatch from './createDispatch';
import createCancelled$ from './createCancelled$';

const debug = (/* ...args */) => {};

export default function createLogicAction$({ action, logic, store, deps,
  cancel$, monitor$, action$ }) {
  const { getState } = store;
  const { name, process: processFn, processOptions: { dispatchReturn,
    dispatchMultiple, successType, failType } } = logic;
  const intercept = logic.validate || logic.transform; // aliases

  debug('createLogicAction$', name, action);
  monitor$.next({ action, name, op: 'begin' }); // also in logicWrapper

  const logicActionOps = [
    (cancel$) ? takeUntil(cancel$) : null, // only takeUntil if cancel or latest
    take(1)
  ].filter(identityFn);

  // logicAction$ is used for the mw next(action) call
  const logicAction$ = Observable.create(logicActionObs => {
    // create notification subject for process which we dispose of
    // when take(1) or when we are done dispatching
    const { cancelled$, setInterceptComplete } = createCancelled$({
      action, cancel$, monitor$, logic });

    const { dispatch, dispatch$, done } = createDispatch({
      action, cancel$, cancelled$, logic, monitor$, store });

    // passed into each execution phase hook as first argument
    const ctx = {}; // for sharing data between hooks
    const depObj = createDepObject({ deps, cancelled$, ctx, getState, action, action$ });


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
      const shouldProcessAndHasProcessFn = shouldProcess && processFn;
      const { useDispatch } = applyAllowRejectNextDefaults(options);
      if (shouldDispatch(act, useDispatch)) {
        monitor$.next({ action, dispAction: act, name, shouldProcess, op: 'nextDisp' });
        setInterceptComplete();
        dispatch(wrapActionForIntercept(act), { allowMore: true }); // will be completed later
        logicActionObs.complete(); // dispatched action, so no next(act)
      } else { // normal next
        if (act) {
          monitor$.next({ action, nextAction: act, name, shouldProcess, op: 'next' });
        } else { // act is undefined, filtered
          monitor$.next({ action, name, shouldProcess, op: 'filtered' });
          setInterceptComplete();
        }
        postIfDefinedOrComplete(act, logicActionObs);
      }

      // unless rejected, we will process even if allow/next dispatched
      if (shouldProcessAndHasProcessFn) { // processing, was an accept
        // if action provided is empty, give process orig
        depObj.action = act || action;

        execProcessFn({ depObj, dispatch, done, processFn,
          dispatchReturn, dispatch$, name });
      } else { // not processing, must have been a reject
        dispatch$.complete();
      }
    }

    /* post if defined, then complete */
    function postIfDefinedOrComplete(act, act$) {
      if (act) {
        act$.next(act);  // triggers call to middleware's next()
      }
      setInterceptComplete();
      act$.complete();
    }

    // start use of the action
    function start() {
      // normal intercept and processing
      return intercept(depObj, allow, reject);
    }

    start();
  }).pipe(...logicActionOps); // take, takeUntil

  return logicAction$;
}

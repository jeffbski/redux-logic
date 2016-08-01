import isObservable from 'is-observable';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { asap } from 'rxjs/scheduler/asap';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/mergeAll';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/observeOn';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/throttleTime';
import compose from './utils/compose';

export default function createLogicMiddleware(arrLogic = [], deps = {}) {
  const actionSrc$ = new Subject();
  let savedStore;
  let savedNext;
  let actionEnd$;
  let logicSub;

  function mw(store) {
    savedStore = store;

    return next => {
      savedNext = next;
      const { action$, sub } = applyLogic(arrLogic, savedStore, savedNext,
                                          logicSub, actionSrc$, deps);
      actionEnd$ = action$;
      logicSub = sub;

      return action => {
        console.log('starting off', action);
        actionSrc$.next(action);
        return action;
      };
    };
  }

  // only call after createStore, relies on store
  // existing state in the logic is preserved
  mw.addLogic = function addLogic(arrNewLogic) {
    const { action$, sub } = applyLogic(arrNewLogic, savedStore, savedNext,
                                        logicSub, actionEnd$, deps);
    actionEnd$ = action$;
    logicSub = sub;
    console.log('added logic');
  };

  // existing state in the logic is reset,
  // in-flight requests should complete
  mw.replaceLogic = function replaceLogic(arrRepLogic) {
    const { action$, sub } = applyLogic(arrRepLogic, savedStore, savedNext,
                                        logicSub, actionSrc$, deps);
    actionEnd$ = action$;
    logicSub = sub;
    console.log('replaced logic');
  };

  return mw;
}

function applyLogic(logic, store, next, sub, actionIn$, deps) {
  if (!store || !next) { throw new Error('store is not defined'); }

  if (sub) { sub.unsubscribe(); }
  const wrappedLogic = logic.map(epic => wrapper(epic, store, deps));
  const actionOut$ = wrappedLogic.reduce((acc$, wep) => wep(acc$),
                                         actionIn$);
  const newSub = actionOut$.subscribe(action => {
    console.log('actionEnd$', action);
    const result = next(action);
    console.log('result', result);
  });

  return {
    action$: actionOut$,
    sub: newSub
  };
}

function wrapper(epic, store, deps) {
  const { name, type, cancelType, latest, debounce, throttle,
          validate, transform,
          process: processFn } = epic;
  const { getState } = store;

  // cancel on cancelType or if take latest specified
  const cancelTypes = []
    .concat((type && latest) ? type : [])
    .concat(cancelType || []);

  const debouncing = (debounce) ?
        act$ => act$.debounceTime(debounce) :
        act$ => act$;

  const throttling = (throttle) ?
        act$ => act$.throttleTime(throttle) :
        act$ => act$;

  const limiting = compose(
    debouncing,
    throttling
  );

  return function wrappedLogic(actionIn$) {
    // we want to share the same copy amongst all here
    const action$ = actionIn$.share();

    const cancel$ = (cancelTypes.length) ?
          action$.filter(action => matchesType(cancelTypes, action.type)) :
          Observable.create((/* obs */) => {}); // shouldn't complete

    // types that don't match will bypass this epic
    const nonMatchingAction$ = action$
      .filter(action => !matchesType(type, action.type));

    const matchingAction$ =
      limiting(action$.filter(action => matchesType(type, action.type)))
        .mergeMap(action => createLogicAction$(action));

    return Observable.merge(
      nonMatchingAction$,
      matchingAction$
    );

    function createLogicAction$(action) {
      console.log('createLogicAction$', name, action);
      const epicAction$ = (new Subject())
        .takeUntil(cancel$)
        .take(1);

      // create notification subject for process which we dispose of
      // when take(1) or when we are done dispatching
      const cancelled$ = (new Subject())
        .take(1);
      cancel$.subscribe(cancelled$); // connect cancelled$ to cancel$

      const dispatch$ = (new Subject())
        .mergeAll()
        .takeUntil(cancel$);
      dispatch$.subscribe({
        next: store.dispatch,
        complete: () => {
          cancelled$.complete();
          cancelled$.unsubscribe();
        }
      });

      const depObj = {
        ...deps,
        cancelled$,
        ctx: {}, // for sharing data between hooks
        getState,
        action
      };

      function allow(act) {
        // bind next with shouldProcess = true
        depObj.action = act;
        transform(depObj, next.bind(null, true));
      }

      function reject(act, useDispatch = false) {
        if (useDispatch) {
          dispatch(act);
          epicAction$.complete();
        } else { // normal next
          depObj.action = act;
          // bind next with shouldProcess = false
          transform(depObj, next.bind(null, false));
        }
      }

      function next(shouldProcess, act) {
        postIfDefinedOrComplete(act, epicAction$);
        if (shouldProcess) { // processing, was an accept
          // delay process slightly so state can be updated
          Observable.of(true)
            .observeOn(asap)
            .subscribe(() => {
              // if action provided is null, give process orig
              if (!act) { depObj.action = action; }
              processFn(depObj, dispatch);
            });
        } else { // not processing, must have been a reject
          dispatch$.complete();
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

      function dispatch(act) {
        if (act) { // ignore empty action
          dispatch$.next( // create obs for mergeAll
            (isObservable(act)) ?
              act :
              Observable.of(act)
          );
        }
        dispatch$.complete();
      }

      // start use of the action
      function start() {
        validate({ ...deps, getState, action }, allow, reject);
      }

      // delay start so subscriptions can happen first
      Observable.of(true)
        .observeOn(asap)
        .subscribe(start);

      return epicAction$;
    }
  };
}

function matchesType(tStrArrRe, type) {
  if (!tStrArrRe) { return false; } // nothing matches none
  if (typeof tStrArrRe === 'string') {
    return (tStrArrRe === type || tStrArrRe === '*');
  }
  if (Array.isArray(tStrArrRe)) {
    return tStrArrRe.some(x => matchesType(x, type));
  }
  // else assume it is a RegExp
  return tStrArrRe.test(type);
}

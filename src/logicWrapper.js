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

export default function logicWrapper(epic, store, deps) {
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

      // passed into each execution phase hook
      const depObj = {
        ...deps,
        cancelled$,
        ctx: {}, // for sharing data between hooks
        getState,
        action
      };

      function allow(act) {
        depObj.action = act;
        // bind next with shouldProcess = true
        function boundNext(nextAction) {
          return next(true, nextAction);
        }
        transform(depObj, boundNext);
      }

      function reject(act, useDispatch = false) {
        if (useDispatch) {
          dispatch(act);
          epicAction$.complete();
          return;
        }

        // normal next
        depObj.action = act;
        // bind next with shouldProcess = false
        function boundNext(nextAction) {
          return next(false, nextAction);
        }
        transform(depObj, boundNext);
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
        validate(depObj, allow, reject);
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

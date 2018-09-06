import { Subject, BehaviorSubject } from 'rxjs';
import { filter, map, scan, takeWhile } from 'rxjs/operators';
import wrapper from './logicWrapper';
import { identityFn, stringifyType } from './utils';

const debug = (/* ...args */) => {};
const OP_INIT = 'init'; // initial monitor op before anything else

/**
   Builds a redux middleware for handling logic (created with
   createLogic). It also provides a way to inject runtime dependencies
   that will be provided to the logic for use during its execution hooks.

   This middleware has two additional methods:
     - `addLogic(arrLogic)` adds additional logic dynamically
     - `replaceLogic(arrLogic)` replaces all logic, existing logic should still complete

   @param {array} arrLogic array of logic items (each created with
     createLogic) used in the middleware. The order in the array
     indicates the order they will be called in the middleware.
   @param {object} deps optional runtime dependencies that will be
     injected into the logic hooks. Anything from config to instances
     of objects or connections can be provided here. This can simply
     testing. Reserved property names: getState, action, and ctx.
   @returns {function} redux middleware with additional methods
     addLogic and replaceLogic
 */
export default function createLogicMiddleware(arrLogic = [], deps = {}) {
  if (!Array.isArray(arrLogic)) {
    throw new Error('createLogicMiddleware needs to be called with an array of logic items');
  }
  const duplicateLogic = findDuplicates(arrLogic);
  if (duplicateLogic.length) {
    throw new Error(`duplicate logic, indexes: ${duplicateLogic}`);
  }

  const actionSrc$ = new Subject(); // mw action stream
  const monitor$ = new Subject(); // monitor all activity
  const lastPending$ = new BehaviorSubject({ op: OP_INIT });
  monitor$.pipe(
    scan((acc, x) => { // append a pending logic count
      let pending = acc.pending || 0;
      switch (x.op) { // eslint-disable-line default-case
        case 'top' : // action at top of logic stack
        case 'begin' : // starting into a logic
          pending += 1;
          break;

        case 'end' : // completed from a logic
        case 'bottom' : // action cleared bottom of logic stack
        case 'nextDisp' : // action changed type and dispatched
        case 'filtered' : // action filtered
        case 'dispatchError' : // error when dispatching
        case 'cancelled' : // action cancelled before intercept complete
                           // dispCancelled is not included here since
                           // already accounted for in the 'end' op
          pending -= 1;
          break;
      }
      return {
        ...x,
        pending
      };
    }, { pending: 0 })
  ).subscribe(lastPending$); // pipe to lastPending

  let savedStore;
  let savedNext;
  let actionEnd$;
  let logicSub;
  let logicCount = 0; // used for implicit naming
  let savedLogicArr = arrLogic; // keep for uniqueness check

  function mw(store) {
    if (savedStore && savedStore !== store) {
      throw new Error('cannot assign logicMiddleware instance to multiple stores, create separate instance for each');
    }
    savedStore = store;

    return next => {
      savedNext = next;
      const { action$, sub, logicCount: cnt } =
            applyLogic(arrLogic, savedStore, savedNext,
                       logicSub, actionSrc$, deps, logicCount,
                       monitor$);
      actionEnd$ = action$;
      logicSub = sub;
      logicCount = cnt;

      return action => {
        debug('starting off', action);
        monitor$.next({ action, op: 'top' });
        actionSrc$.next(action);
        return action;
      };
    };
  }

  /**
    observable to monitor flow in logic
    */
  mw.monitor$ = monitor$;

  /**
     Resolve promise when all in-flight actions are complete passing
     through fn if provided
     @param {function} fn optional fn() which is invoked on completion
     @return {promise} promise resolves when all are complete
    */
  mw.whenComplete = function whenComplete(fn = identityFn) {
    return lastPending$.pipe(
      // tap(x => console.log('wc', x)), /* keep commented out */
      takeWhile(x => x.pending),
      map((/* x */) => undefined) // not passing along anything
    ).toPromise()
      .then(fn);
  };

  /**
     add additional deps after createStore has been run. Useful for
     dynamically injecting dependencies for the hooks. Throws an error
     if it tries to override an existing dependency with a new
     value or instance.
     @param {object} additionalDeps object of dependencies to add
     @return {undefined}
    */
  mw.addDeps = function addDeps(additionalDeps) {
    if (typeof additionalDeps !== 'object') {
      throw new Error('addDeps should be called with an object');
    }
    Object.keys(additionalDeps).forEach(k => {
      const existing = deps[k];
      const newValue = additionalDeps[k];
      if (typeof existing !== 'undefined' && // previously existing dep
          existing !== newValue) { // no override
        throw new Error(`addDeps cannot override an existing dep value: ${k}`);
      }
      // eslint-disable-next-line no-param-reassign
      deps[k] = newValue;
    });
  };

  /**
    add logic after createStore has been run. Useful for dynamically
    loading bundles at runtime. Existing state in logic is preserved.
    @param {array} arrNewLogic array of logic items to add
    @return {object} object with a property logicCount set to the count of logic items
   */
  mw.addLogic = function addLogic(arrNewLogic) {
    if (!arrNewLogic.length) { return { logicCount }; }
    const combinedLogic = savedLogicArr.concat(arrNewLogic);
    const duplicateLogic = findDuplicates(combinedLogic);
    if (duplicateLogic.length) {
      throw new Error(`duplicate logic, indexes: ${duplicateLogic}`);
    }
    const { action$, sub, logicCount: cnt } =
          applyLogic(arrNewLogic, savedStore, savedNext,
                     logicSub, actionEnd$, deps, logicCount, monitor$);
    actionEnd$ = action$;
    logicSub = sub;
    logicCount = cnt;
    savedLogicArr = combinedLogic;
    debug('added logic');
    return { logicCount: cnt };
  };

  mw.mergeNewLogic = function mergeNewLogic(arrMergeLogic) {
    // check for duplicates within the arrMergeLogic first
    const duplicateLogic = findDuplicates(arrMergeLogic);
    if (duplicateLogic.length) {
      throw new Error(`duplicate logic, indexes: ${duplicateLogic}`);
    }
    // filter out any refs that match existing logic, then addLogic
    const arrNewLogic = arrMergeLogic.filter(x =>
      savedLogicArr.indexOf(x) === -1);
    return mw.addLogic(arrNewLogic);
  };

  /**
   replace all existing logic with a new array of logic.
   In-flight requests should complete. Logic state will be reset.
   @param {array} arrRepLogic array of replacement logic items
   @return {object} object with a property logicCount set to the count of logic items
   */
  mw.replaceLogic = function replaceLogic(arrRepLogic) {
    const duplicateLogic = findDuplicates(arrRepLogic);
    if (duplicateLogic.length) {
      throw new Error(`duplicate logic, indexes: ${duplicateLogic}`);
    }
    const { action$, sub, logicCount: cnt } =
          applyLogic(arrRepLogic, savedStore, savedNext,
                     logicSub, actionSrc$, deps, 0, monitor$);
    actionEnd$ = action$;
    logicSub = sub;
    logicCount = cnt;
    savedLogicArr = arrRepLogic;
    debug('replaced logic');
    return { logicCount: cnt };
  };

  return mw;
}

function applyLogic(arrLogic, store, next, sub, actionIn$, deps,
                    startLogicCount, monitor$) {
  if (!store || !next) { throw new Error('store is not defined'); }

  if (sub) { sub.unsubscribe(); }

  const wrappedLogic = arrLogic.map((logic, idx) => {
    const namedLogic = naming(logic, idx + startLogicCount);
    return wrapper(namedLogic, store, deps, monitor$);
  });
  const actionOut$ = wrappedLogic.reduce((acc$, wep) => wep(acc$),
                                         actionIn$);
  const newSub = actionOut$.subscribe(action => {
    debug('actionEnd$', action);
    try {
      const result = next(action);
      debug('result', result);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('error in mw dispatch or next call, probably in middlware/reducer/render fn:', err);
      const msg = (err && err.message) ? err.message : err;
      monitor$.next({ action, err: msg, op: 'nextError' });
    }
    // at this point, action is the transformed action, not original
    monitor$.next({ nextAction: action, op: 'bottom' });
  });

  return {
    action$: actionOut$,
    sub: newSub,
    logicCount: startLogicCount + arrLogic.length
  };
}

/**
 * Implement default names for logic using type and idx
 * @param {object} logic named or unnamed logic object
 * @param {number} idx  index in the logic array
 * @return {object} namedLogic named logic
 */
function naming(logic, idx) {
  if (logic.name) { return logic; }
  return {
    ...logic,
    name: `L(${stringifyType(logic.type)})-${idx}`
  };
}

/**
  Find duplicates in arrLogic by checking if ref to same logic object
  @param {array} arrLogic array of logic to check
  @return {array} array of indexes to duplicates, empty array if none
 */
function findDuplicates(arrLogic) {
  return arrLogic.reduce((acc, x1, idx1) => {
    if (arrLogic.some((x2, idx2) => (idx1 !== idx2 && x1 === x2))) {
      acc.push(idx1);
    }
    return acc;
  }, []);
}

import { Subject } from 'rxjs/Subject';
import wrapper from './logicWrapper';

const debug = (/* ...args */) => {};

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

  const actionSrc$ = new Subject();
  let savedStore;
  let savedNext;
  let actionEnd$;
  let logicSub;
  let logicCount = 0; // used for implicit naming

  function mw(store) {
    savedStore = store;

    return next => {
      savedNext = next;
      const { action$, sub, logicCount: cnt } =
            applyLogic(arrLogic, savedStore, savedNext,
                       logicSub, actionSrc$, deps, logicCount);
      actionEnd$ = action$;
      logicSub = sub;
      logicCount = cnt;

      return action => {
        debug('starting off', action);
        actionSrc$.next(action);
        return action;
      };
    };
  }

  /**
    add logic after createStore has been run. Useful for dynamically
    loading bundles at runtime. Existing state in logic is preserved.
    @param {array} arrNewLogic array of logic items to add
    @return {object} object with a property logicCount set to the count of logic items
   */
  mw.addLogic = function addLogic(arrNewLogic) {
    const { action$, sub, logicCount: cnt } =
          applyLogic(arrNewLogic, savedStore, savedNext,
                     logicSub, actionEnd$, deps, logicCount);
    actionEnd$ = action$;
    logicSub = sub;
    logicCount = cnt;
    debug('added logic');
    return { logicCount: cnt };
  };

  /**
   replace all existing logic with a new array of logic.
   In-flight requests should complete. Logic state will be reset.
   @param {array} arrRepLogic array of replacement logic items
   @return {object} object with a property logicCount set to the count of logic items
   */
  mw.replaceLogic = function replaceLogic(arrRepLogic) {
    const { action$, sub, logicCount: cnt } =
          applyLogic(arrRepLogic, savedStore, savedNext,
                     logicSub, actionSrc$, deps, 0);
    actionEnd$ = action$;
    logicSub = sub;
    logicCount = cnt;
    debug('replaced logic');
    return { logicCount: cnt };
  };

  return mw;
}

function applyLogic(arrLogic, store, next, sub, actionIn$, deps,
                    startLogicCount) {
  if (!store || !next) { throw new Error('store is not defined'); }

  if (sub) { sub.unsubscribe(); }

  const wrappedLogic = arrLogic.map((logic, idx) => {
    const namedLogic = naming(logic, idx + startLogicCount);
    return wrapper(namedLogic, store, deps);
  });
  const actionOut$ = wrappedLogic.reduce((acc$, wep) => wep(acc$),
                                         actionIn$);
  const newSub = actionOut$.subscribe(action => {
    debug('actionEnd$', action);
    const result = next(action);
    debug('result', result);
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
    name: `L(${logic.type.toString()})-${idx}`
  };
}

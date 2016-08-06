import { Subject } from 'rxjs/Subject';
import wrapper from './logicWrapper';

const debug = (/* ...args */) => {};

export default function createLogicMiddleware(arrLogic = [], deps = {}) {
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

  // only call after createStore, relies on store
  // existing state in the logic is preserved
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

  // existing state in the logic is reset,
  // in-flight requests should complete
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

import { Subject } from 'rxjs/Subject';
import wrapper from './logicWrapper';

const debug = (/* ...args */) => {};

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
        debug('starting off', action);
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
    debug('added logic');
  };

  // existing state in the logic is reset,
  // in-flight requests should complete
  mw.replaceLogic = function replaceLogic(arrRepLogic) {
    const { action$, sub } = applyLogic(arrRepLogic, savedStore, savedNext,
                                        logicSub, actionSrc$, deps);
    actionEnd$ = action$;
    logicSub = sub;
    debug('replaced logic');
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
    debug('actionEnd$', action);
    const result = next(action);
    debug('result', result);
  });

  return {
    action$: actionOut$,
    sub: newSub
  };
}

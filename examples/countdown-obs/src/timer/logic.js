import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { createLogic } from 'redux-logic';

import { TIMER_START, TIMER_CANCEL, TIMER_RESET, TIMER_END,
         TIMER_DECREMENT, timerEnd, timerDecrement,
         timerStartError } from './actions';
import { selectors as timerSel } from './reducer';

export const timerStartLogic = createLogic({
  type: TIMER_START,
  cancelType: [TIMER_CANCEL, TIMER_RESET, TIMER_END], // any will cancel

  // check to see if it is valid to start, > 0
  validate({ getState, action }, allow, reject) {
    const state = getState();
    if (timerSel.status(state) === 'started') {
      // already started just silently reject
      return reject();
    }
    if (timerSel.value(state) > 0) {
      allow(action);
    } else {
      reject(timerStartError(new Error('Can\'t start, already zero. Reset first')));
    }
  },

  // by omitting dispatch and done, process will use the return
  // to determine what to dispatch. In this case we returned
  // an observable so it will dispatch any values that were emitted
  process(depObj) {
    return interval(1000).pipe(
      map(() => timerDecrement()) // send timerDecrement actions
    );
  }
});

const timerDecrementLogic = createLogic({
  type: TIMER_DECREMENT,

  validate({ getState, action }, allow, reject) {
    const state = getState();
    if (timerSel.value(state) > 0) {
      allow(action);
    } else { // shouldn't get here, but if does end
      reject(timerEnd());
    }
  },

  process({ getState }, dispatch, done) {
    // unless other middleware/logic introduces async behavior, the
    // state will have been updated by the reducers before process runs
    const state = getState();
    if (timerSel.value(state) === 0) {
      dispatch(timerEnd());
    }
    done(); // call when done dispatching
  }
});


export default [
  timerStartLogic,
  timerDecrementLogic
];

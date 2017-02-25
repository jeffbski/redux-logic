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

  // this process never ends until cancelled otherwise we would call done
  process({ cancelled$ }, dispatch, done) {
    const interval = setInterval(() => {
      dispatch(timerDecrement());
    }, 1000);

    // The declarative cancellation already stops future dispatches
    // but we should go ahead and stop the timer we created.
    // If cancelled, stop the time interval
    cancelled$.subscribe(() => {
      clearInterval(interval);
    });
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
    done(); // we are done dispatching for this logic
  }
});


export default [
  timerStartLogic,
  timerDecrementLogic
];

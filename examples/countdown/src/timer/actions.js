
// unique key namespace used by combineReducers.
// By convention it will match the directory structure to
// make it easy to locate the src.
// Also action types will prefix with the capitalized version
export const key = 'timer';

// action type constants
export const TIMER_START = 'TIMER_START';
export const TIMER_CANCEL = 'TIMER_CANCEL';
export const TIMER_RESET = 'TIMER_RESET';
export const TIMER_END = 'TIMER_END';
export const TIMER_DECREMENT = 'TIMER_DECREMENT';
export const TIMER_START_ERROR = 'TIMER_START_ERROR';

export const actionTypes = {
  TIMER_START,
  TIMER_CANCEL,
  TIMER_RESET,
  TIMER_END,
  TIMER_DECREMENT,
  TIMER_START_ERROR
};


// action creators
export const timerStart = () => ({ type: TIMER_START });
export const timerCancel = () => ({ type: TIMER_CANCEL });
export const timerReset = () => ({ type: TIMER_RESET });
export const timerEnd = () => ({ type: TIMER_END });
export const timerDecrement = () => ({ type: TIMER_DECREMENT });
export const timerStartError = (err) => ({
  type: TIMER_START_ERROR,
  payload: err,
  error: true
});

export const actions = {
  timerStart,
  timerCancel,
  timerReset,
  timerEnd,
  timerDecrement,
  timerStartError
};

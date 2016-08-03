
// unique key namespace used by combineReducers.
// By convention it will match the directory structure to
// make it easy to locate the src.
// Also action types will prefix with the capitalized version
export const key = 'polls';

// action type constants
export const POLLS_FETCH = 'POLLS_FETCH';
export const POLLS_FETCH_CANCEL = 'POLLS_FETCH_CANCEL';
export const POLLS_FETCH_FULFILLED = 'POLLS_FETCH_FULFILLED';
export const POLLS_FETCH_REJECTED = 'POLLS_FETCH_REJECTED';

export const actionTypes = {
  POLLS_FETCH,
  POLLS_FETCH_CANCEL,
  POLLS_FETCH_FULFILLED,
  POLLS_FETCH_REJECTED
};

// action creators
export const pollsFetch = () => ({ type: POLLS_FETCH });
export const pollsFetchCancel = () => ({ type: POLLS_FETCH_CANCEL });
export const pollsFetchFulfilled = (polls) => ({
  type: POLLS_FETCH_FULFILLED,
  payload: polls
});
export const pollsFetchRejected = (err) => ({
  type: POLLS_FETCH_REJECTED,
  payload: err,
  error: true
});

export const actions = {
  pollsFetch,
  pollsFetchCancel,
  pollsFetchFulfilled,
  pollsFetchRejected
};

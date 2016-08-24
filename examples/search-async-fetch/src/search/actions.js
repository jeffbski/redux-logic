
// unique key namespace used by combineReducers.
// By convention it will match the directory structure to
// make it easy to locate the src.
// Also action types will prefix with the capitalized version
export const key = 'search';

// action type constants
export const SEARCH = 'SEARCH';
export const SEARCH_FULFILLED = 'SEARCH_FULFILLED';
export const SEARCH_REJECTED = 'SEARCH_REJECTED';

export const actionTypes = {
  SEARCH,
  SEARCH_FULFILLED,
  SEARCH_REJECTED
};

// action creators
export const search = ev => ({ type: SEARCH, payload: ev.target.value });
export const searchFulfilled = (users) => ({
  type: SEARCH_FULFILLED,
  payload: users
});
export const searchRejected = (err) => ({
  type: SEARCH_REJECTED,
  payload: err,
  error: true
});

export const actions = {
  search,
  searchFulfilled,
  searchRejected
};

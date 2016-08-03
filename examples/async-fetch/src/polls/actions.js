import { createAction } from 'redux-actions';

// unique key namespace used to separate action types and
// is used by combineReducers. By convention it will match
// the directory structure to make it easy to locate the src
export const key = 'polls';

// action creators, note each of these functions returns the
// action type constant associated with it by coercing to a string
// (or calling toString()). So we don't have to manage constants
// and creators, they are both contained in one.
export const pollsFetch = createAction(`${key}/FETCH`);
export const pollsFetchCancel = createAction(`${key}/FETCH_CANCEL`);
export const pollsFetchFulfilled = createAction(`${key}/FETCH_FULFILLED`);
export const pollsFetchRejected = createAction(`${key}/FETCH_REJECTED`);

export default {
  pollsFetch,
  pollsFetchCancel,
  pollsFetchFulfilled,
  pollsFetchRejected
};

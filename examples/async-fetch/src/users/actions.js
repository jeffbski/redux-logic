import { createAction } from 'redux-actions';

// unique key namespace used to separate action types and
// is used by combineReducers. By convention it will match
// the directory structure to make it easy to locate the src
export const key = 'users';

// action creators, note each of these functions returns the
// action type constant associated with it by coercing to a string
// (or calling toString()). So we don't have to manage constants
// and creators, they are both contained in one.
export const usersFetch = createAction(`${key}/FETCH`);
export const usersFetchCancel = createAction(`${key}/FETCH_CANCEL`);
export const usersFetchFulfilled = createAction(`${key}/FETCH_FULFILLED`);
export const usersFetchRejected = createAction(`${key}/FETCH_REJECTED`);

export default {
  usersFetch,
  usersFetchCancel,
  usersFetchFulfilled,
  usersFetchRejected
};

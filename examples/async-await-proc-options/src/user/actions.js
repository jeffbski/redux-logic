
// unique key namespace used by combineReducers.
// By convention it will match the directory structure to
// make it easy to locate the src.
// Also action types will prefix with the capitalized version
export const key = 'user';

// action type constants
export const USER_PROFILE_FETCH = 'USER_PROFILE_FETCH';
export const USER_PROFILE_FETCH_CANCEL = 'USER_PROFILE_FETCH_CANCEL';
export const USER_PROFILE_FETCH_FULFILLED = 'USER_PROFILE_FETCH_FULFILLED';
export const USER_PROFILE_FETCH_REJECTED = 'USER_PROFILE_FETCH_REJECTED';

export const actionTypes = {
  USER_PROFILE_FETCH,
  USER_PROFILE_FETCH_CANCEL,
  USER_PROFILE_FETCH_FULFILLED,
  USER_PROFILE_FETCH_REJECTED
};

// action creators
export const userProfileFetch = (id) => (
  {
    type: USER_PROFILE_FETCH,
    payload: id
  }
);
export const userProfileFetchCancel = () => ({ type: USER_PROFILE_FETCH_CANCEL });
export const userProfileFetchFulfilled = (users) => ({
  type: USER_PROFILE_FETCH_FULFILLED,
  payload: users
});
export const userProfileFetchRejected = (err) => ({
  type: USER_PROFILE_FETCH_REJECTED,
  payload: err,
  error: true
});

export const actions = {
  userProfileFetch,
  userProfileFetchCancel,
  userProfileFetchFulfilled,
  userProfileFetchRejected
};

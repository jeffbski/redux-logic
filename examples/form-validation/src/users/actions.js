
// unique key namespace used by combineReducers.
// By convention it will match the directory structure to
// make it easy to locate the src.
// Also action types will prefix with the capitalized version
export const key = 'users';

// action type constants
export const USERS_FIELD_UPDATED = 'USERS_FIELD_UPDATED';
export const USERS_FIELD_INVALID = 'USERS_FIELD_INVALID';
export const USERS_ADD = 'USERS_ADD';
export const USERS_ADD_SUCCESS = 'USERS_ADD_SUCCESS';
export const USERS_ADD_FAILED = 'USERS_ADD_FAILED';

export const actionTypes = {
  USERS_FIELD_UPDATED,
  USERS_FIELD_INVALID,
  USERS_ADD,
  USERS_ADD_SUCCESS,
  USERS_ADD_FAILED
};

// action creators
export const usersFieldUpdated = (evt) => ({
  type: USERS_FIELD_UPDATED,
  payload: {
    name: evt.target.name || evt.target.id,
    value: evt.target.value
  }
});

export const usersFieldInvalid = (errors, fieldUpdate) => ({
  type: USERS_FIELD_INVALID,
  payload: {
    errors,
    fieldUpdate
  }
});

export const usersAdd = (evt) => {
  evt.preventDefault();
  return { type: USERS_ADD };
};

export const usersAddSuccess = (user) => ({
  type: USERS_ADD_SUCCESS,
  payload: user
});

export const usersAddFailed = (err) => ({
  type: USERS_ADD_FAILED,
  payload: err,
  error: true
});

export const actions = {
  usersFieldUpdated,
  usersFieldInvalid,
  usersAdd,
  usersAddSuccess,
  usersAddFailed
};

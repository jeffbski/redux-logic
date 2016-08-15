import { key, USER_PROFILE_FETCH, USER_PROFILE_FETCH_CANCEL, USER_PROFILE_FETCH_FULFILLED,
         USER_PROFILE_FETCH_REJECTED } from './actions';

export const selectors = {
  user: state => state[key].user,
  fetchStatus: state => state[key].fetchStatus
};

const initialState = {
  user: null,
  fetchStatus: ''
};

export default function reducer(state = initialState, action) {
  switch(action.type) {
  case USER_PROFILE_FETCH:
    return {
      ...state,
      fetchStatus: `fetching ID:${action.payload}... ${(new Date()).toLocaleString()}`,
      user: null
    };
  case USER_PROFILE_FETCH_FULFILLED:
    return {
      ...state,
      user: action.payload,
      fetchStatus: `Results from ${(new Date()).toLocaleString()}`
    };
  case USER_PROFILE_FETCH_REJECTED:
    return {
      ...state,
      fetchStatus: `errored: ${action.payload}`
    };
  case USER_PROFILE_FETCH_CANCEL:
    return {
      ...state,
      fetchStatus: 'user cancelled'
    };
  default:
    return state;
  }
}

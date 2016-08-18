import { handleActions } from 'redux-actions';
import { key, usersFetch, usersFetchCancel, usersFetchFulfilled,
         usersFetchRejected } from './actions';

export const selectors = {
  users: state => state[key].list,
  fetchStatus: state => state[key].fetchStatus
};

const initialState = {
  list: [],
  fetchStatus: ''
};

export default handleActions({
  [usersFetch]: (state, action) => {
    return {
      ...state,
      fetchStatus: `fetching... ${(new Date()).toLocaleString()}`,
      list: []
    };
  },
  [usersFetchFulfilled]: (state, action) => {
    return {
      ...state,
      list: action.payload,
      fetchStatus: `Results from ${(new Date()).toLocaleString()}`
    };
  },
  [usersFetchRejected]: (state, action) => {
    return {
      ...state,
      fetchStatus: `errored: ${action.payload}`
    };
  },
  [usersFetchCancel]: (state, action) => {
    return {
      ...state,
      fetchStatus: 'user cancelled'
    };
  }
}, initialState);

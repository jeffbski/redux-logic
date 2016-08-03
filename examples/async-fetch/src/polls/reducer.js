import { handleActions } from 'redux-actions';
import { key, pollsFetch, pollsFetchCancel, pollsFetchFulfilled,
         pollsFetchRejected } from './actions';

export const selectors = {
  polls: state => state[key].list,
  fetchStatus: state => state[key].fetchStatus
};

const initialState = {
  list: [],
  fetchStatus: ''
};

export default handleActions({
  [pollsFetch]: (state, action) => {
    return {
      ...state,
      fetchStatus: `fetching... ${(new Date()).toLocaleString()}`,
      list: []
    };
  },
  [pollsFetchFulfilled]: (state, action) => {
    return {
      ...state,
      list: action.payload,
      fetchStatus: `Results from ${(new Date()).toLocaleString()}`
    };
  },
  [pollsFetchRejected]: (state, action) => {
    return {
      ...state,
      fetchStatus: `errored: ${action.payload}`
    };
  },
  [pollsFetchCancel]: (state, action) => {
    return {
      ...state,
      fetchStatus: 'user cancelled'
    };
  }
}, initialState);

import axios from 'axios';
import { createStore, applyMiddleware } from 'redux';
import { createLogic, createLogicMiddleware } from 'redux-logic';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect, Provider } from 'react-redux';

const initialState = {
  list: [],
  fetchStatus: ''
};

const USERS_FETCH = 'USERS_FETCH';
const USERS_FETCH_CANCEL = 'USERS_FETCH_CANCEL';
const USERS_FETCH_FULFILLED = 'USERS_FETCH_FULFILLED';
const USERS_FETCH_REJECTED = 'USERS_FETCH_REJECTED';
function usersFetch() { return { type: USERS_FETCH }; }
function usersFetchCancel() { return { type: USERS_FETCH_CANCEL }; }

const delay = 2; // 2s delay for interactive use of cancel/take latest
const usersFetchLogic = createLogic({
  type: USERS_FETCH,
  cancelType: USERS_FETCH_CANCEL,
  latest: true, // take latest only

  // use axios injected as httpClient from configureStore logic deps
  // we also have access to getState and action in the first argument
  // but they were not needed for this particular code
  process({ httpClient }, dispatch) {
    // the delay query param adds arbitrary delay to the response
    httpClient.get(`http://reqres.in/api/users?delay=${delay}`)
      .then(resp => resp.data.data) // use data property of payload
      .then(users => dispatch({
        type: USERS_FETCH_FULFILLED,
        payload: users
      }))
      .catch((err) => dispatch({
        type: USERS_FETCH_REJECTED,
        payload: err,
        error: true
      }));
  }
});

const deps = { // injected dependencies for logic
  httpClient: axios
};
const arrLogic = [usersFetchLogic];
const logicMiddleware = createLogicMiddleware(arrLogic, deps);
const store = createStore(reducer, initialState,
                          applyMiddleware(logicMiddleware));

const ConnectedApp = connect(
  state => ({
    users: state.list,
    fetchStatus: state.fetchStatus
  }),
  {
    usersFetch,
    usersFetchCancel
  }
)(App);

function App({ users, fetchStatus, usersFetch, usersFetchCancel }) {
  return (
    <div>
      <div>Status: { fetchStatus }</div>
      <button onClick={ usersFetch }>Fetch users</button>
      <button onClick={ usersFetchCancel }>Cancel</button>
      <ul>
        {
          users.map(user => (
            <li key={ user.id }>{ user.first_name } { user.last_name }</li>
          ))
        }
      </ul>
    </div>
  );
}

ReactDOM.render(
  <Provider store={ store }>
    <ConnectedApp />
  </Provider>,
  document.getElementById('root')
);

function reducer(state = initialState, action) {
  switch(action.type) {
  case USERS_FETCH:
    return {
      ...state,
      fetchStatus: `fetching... ${(new Date()).toLocaleString()}`,
      list: []
    };
  case USERS_FETCH_FULFILLED:
    return {
      ...state,
      list: action.payload,
      fetchStatus: `Results from ${(new Date()).toLocaleString()}`
    };
  case USERS_FETCH_REJECTED:
    return {
      ...state,
      fetchStatus: `errored: ${action.payload}`
    };
  case USERS_FETCH_CANCEL:
    return {
      ...state,
      fetchStatus: 'user cancelled'
    };
  default:
    return state;
  }
}

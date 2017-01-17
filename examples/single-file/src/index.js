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

const NPM_SEARCH = 'NPM_SEARCH';
const NPM_SEARCH_FULFILLED = 'NPM_SEARCH_FULFILLED';
const NPM_SEARCH_REJECTED = 'NPM_SEARCH_REJECTED';
function npmSearch(ev) {
  return { type: NPM_SEARCH, payload: ev.target.value };
}

const npmSearchLogic = createLogic({
  type: NPM_SEARCH,
  debounce: 500, // ms
  latest: true, // take latest only

  // only allow non-empty payloads
  validate({ getState, action }, allow, reject) {
    if (action.payload) {
      allow(action);
    } else { // empty request, silently reject
      reject();
    }
  },

  // use axios injected as httpClient from configureStore logic deps
  process({ httpClient, getState, action }, dispatch, done) {
    httpClient.get(`https://npmsearch.com/query?q=${action.payload}&fields=name,description`)
      .then(resp => resp.data.results) // use results prop of payload
      .then(results => dispatch({
        type: NPM_SEARCH_FULFILLED,
        payload: results
      }))
      .catch((err) => {
        console.error(err); // might be a render err
        dispatch({
          type: NPM_SEARCH_REJECTED,
          payload: err,
          error: true
        })
      })
      .then(() => done()); // call when done dispatching
  }
});

const deps = { // injected dependencies for logic
  httpClient: axios
};
const arrLogic = [npmSearchLogic];
const logicMiddleware = createLogicMiddleware(arrLogic, deps);
const store = createStore(reducer, initialState,
                          applyMiddleware(logicMiddleware));

const ConnectedApp = connect(
  state => ({
    results: state.list,
    fetchStatus: state.fetchStatus
  }),
  {
    npmSearch
  }
)(App);

function App({ results, fetchStatus, npmSearch }) {
  return (
    <div>
      <h3>Search npmsearch.com for packages</h3>
      <div>Status: { fetchStatus }</div>
      <input autoFocus="true"
        onChange={ npmSearch }
        placeholder="package keywords" />
      <ul>
        {
          results.map(result => (
            <li key={ result.name[0] }>{ result.name[0] } - { result.description[0] }</li>
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
  case NPM_SEARCH:
    return {
      ...state,
      fetchStatus: `fetching for ${action.payload}... ${(new Date()).toLocaleString()}`,
      list: []
    };
  case NPM_SEARCH_FULFILLED:
    return {
      ...state,
      list: action.payload,
      fetchStatus: `Results from ${(new Date()).toLocaleString()}`
    };
  case NPM_SEARCH_REJECTED:
    return {
      ...state,
      fetchStatus: `errored: ${action.payload}`
    };
  default:
    return state;
  }
}

import { connect } from 'react-redux';
import React from 'react';
import logo from './logo.svg';
import './App.css';
import { component as Search,
         selectors as searchSel,
         actions as searchActions } from './search/index';
const { search } = searchActions;

export function App({ results, fetchStatus, search }) {
  return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Search Async RxJS</h2>
        </div>
        <div className="usersDiv">
          <div className="desc">
            <p>Demonstrates the use of redux-logic to perform automatic async search as the input changes. This example uses the built-in declarative functionality for debouncing and limiting (takeLatest). It uses RxJS ajax which return an observable and is cancellable. When limiting or cancellation occurs, the cancellation is bubbled up to the XHR request which is aborted.
            </p>
      <p><b>Usage:</b> Type some keywords and on each keystroke a change event is firing a search action. The searchLogic debounces those so that only after 500ms of inactivity witll the search be passed through. Also if the search changes again before the results return, the "take latest" feature ensures that only the results correpsonding to the last search will be used (even if they arrive out of order) and since we are using RxJS ajax the XHR requests are actually aborted as well.
            </p>
            <p>The logic code for this example lives in <code>src/search/logic.js</code>. The logic middleware setup and runtime dependencies injected into logic are in <code>src/configureStore.js</code>
            </p>
          </div>

          <div className="main">
            <Search results={ results } fetchStatus={ fetchStatus }
                   onFetch={ search } />
          </div>
        </div>
      </div>
  );
}

const enhance = connect(
  state => ({
    results: searchSel.results(state),
    fetchStatus: searchSel.fetchStatus(state)
  }),
  {
    search
  }
);

export default enhance(App);

import { connect } from 'react-redux';
import React from 'react';
import logo from './logo.svg';
import './App.css';
import { component as Polls,
         selectors as pollsSel,
         actions as pollsActions } from './polls/index';
const { pollsFetch, pollsFetchCancel } = pollsActions;

export function App({ polls, fetchStatus, pollsFetch, pollsFetchCancel }) {
  return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Async Fetch Vanilla</h2>
        </div>
        <div className="pollsDiv">
          <div className="desc">
            <p>Demonstrates the use of redux-logic to perform async fetching. This example uses the built-in declarative functionality for cancellation and limiting (takeLatest).
            </p>
            <p><b>Usage:</b> Click on the fetch button to initiate a fetch, click cancel to abort the fetch, or click the fetch button multiple times to see that only the last fetch is used.
            </p>
            <p>The logic code for this example lives in <code>src/polls/logic.js</code>. The logic middleware setup and runtime dependencies injected into logic are in <code>src/configureStore.js</code>
            </p>
             <p>Note: fetching has an artificial 4s delay to allow for interacting with the cancellation and take latest functionality.
             </p>
          </div>

          <div className="main">
            <Polls polls={ polls } fetchStatus={ fetchStatus }
                   fetchPolls={ pollsFetch }
                   cancelFetchPolls={ pollsFetchCancel } />
          </div>
        </div>
      </div>
  );
}

const enhance = connect(
  state => ({
    polls: pollsSel.polls(state),
    fetchStatus: pollsSel.fetchStatus(state)
  }),
  {
    pollsFetch,
    pollsFetchCancel
  }
);

export default enhance(App);

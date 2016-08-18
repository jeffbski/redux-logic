import { connect } from 'react-redux';
import React from 'react';
import logo from './logo.svg';
import './App.css';
import { component as Users,
         selectors as usersSel,
         actions as usersActions } from './users/index';
const { usersFetch, usersFetchCancel } = usersActions;

export function App({ users, fetchStatus, usersFetch, usersFetchCancel }) {
  return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Async RxJS Ajax Fetch with Process Options</h2>
        </div>
        <div className="usersDiv">
          <div className="desc">
      <p>Demonstrates the use of redux-logic to perform async fetching using RxJS ajax (with xhr abort on cancel) and the new processOptions feature. This example uses the built-in declarative functionality for cancellation and limiting (takeLatest).
      </p>

<p>The new `processOptions` feature allows you to clean up your code even further by declaring that you want to use the return value and apply these action types. Then you can simply return a promise, observable, object, or error and redux-logic will dispatch the associated type.</p>

            <p><b>Usage:</b> Click on the fetch button to initiate a fetch, click cancel to abort the fetch, or click the fetch button multiple times to see that only the last fetch is used.
            </p>
            <p>The logic code for this example lives in <code>src/users/logic.js</code>. The logic middleware setup and runtime dependencies injected into logic are in <code>src/configureStore.js</code>
            </p>
             <p>Note: fetching has an artificial 4s delay to allow for interacting with the cancellation and take latest functionality.
             </p>
          </div>

          <div className="main">
            <Users users={ users } fetchStatus={ fetchStatus }
                   onFetch={ usersFetch }
                   onCancelFetch={ usersFetchCancel } />
          </div>
        </div>
      </div>
  );
}

const enhance = connect(
  state => ({
    users: usersSel.users(state),
    fetchStatus: usersSel.fetchStatus(state)
  }),
  {
    usersFetch,
    usersFetchCancel
  }
);

export default enhance(App);

import { connect } from 'react-redux';
import React from 'react';
import logo from './logo.svg';
import './App.css';

import { component as Users,
         selectors as usersSel,
         actions as usersActions } from './users/index';
const { usersFetch, usersFetchCancel } = usersActions;

import { component as User,
         selectors as userSel,
         actions as userActions } from './user/index';
const { userProfileFetch, userProfileFetchCancel } = userActions;

const CUsers = connect(
  state => ({
    users: usersSel.users(state),
    fetchStatus: usersSel.fetchStatus(state)
  }),
  {
    onFetch: usersFetch,
    onCancelFetch: usersFetchCancel,
    onFetchProfile: userProfileFetch
  }
)(Users);

const CUser = connect(
  state => ({
    user: userSel.user(state),
    fetchStatus: userSel.fetchStatus(state)
  }),
  {
    onCancelFetch: userProfileFetchCancel
  }
)(User);

export function App({ user, profileFetchStatus, userProfileFetch,
                      userProfileFetchCancel }) {
  return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Async Await - Async Functions</h2>
        </div>
        <div className="container">
          <div className="desc">
            <p>Demonstrates the use of redux-logic to perform async fetching using async functions (async await). This example uses the built-in declarative functionality for cancellation and limiting (takeLatest).
            </p>
            <p><b>Usage:</b> Click on the "Fetch Users" button to initiate a fetch of users. Click "Cancel" to abort the fetch, or click the "Fetch Users" button multiple times to see that only the last fetch is used.
            </p>
            <p>Once the list of users is displayed, click on any of the user buttons to fetch the details for that user. You may click the "Cancel User Fetch" button to cancel a fetch or simply click on another user button and the previous fetch will be ignored when it completes.
            </p>
            <p>The logic code for this example lives in <code>src/users/logic.js</code> and <code>src/user/logic.js</code>. It uses async/await to perform fetching. The logic middleware setup and runtime dependencies injected into logic are in <code>src/configureStore.js</code>
            </p>
             <p>Note: fetching has an artificial 2s delay to allow for interacting with the cancellation and take latest functionality.
             </p>
          </div>

          <table className="main">
          <tbody>
            <tr className="mainRow">
              <td className="users">
                <h2>Users</h2>
                <CUsers />
              </td>
              <td className="user">
                <h2>Selected User</h2>
                <CUser />
              </td>
            </tr>
          </tbody>
          </table>

        </div>
      </div>
  );
}



export default App;

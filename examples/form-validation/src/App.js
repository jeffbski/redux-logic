import { connect } from 'react-redux';
import React from 'react';
import logo from './logo.svg';
import './App.css';
import { component as Users,
         selectors as userSel,
         actions as usersActions } from './users/index';
const { usersFieldUpdated, usersAdd } = usersActions;

export function App({ userFields, validationErrors, fieldsValid, message,
                      userList, usersFieldUpdated, usersAdd }) {
  return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Form Validation</h2>
        </div>
        <div className="usersDiv">
          <div className="desc">
            <p>Demonstrates the use of redux-logic to perform form validation. async fetching. The validation logic has access to the entire state tree to determine validity. If valid it will allow the USER_FIELDS_UPDATED action to pass through, otherwise it will instead reject with a USER_FIELDS_INVALID action containing both the errors and the field update.
            </p>
            <p>Usage: enter data into the form fields. Both fields are required so as soon as data changes the validation logic will be invoked and if there are any errors they will be displayed. Errors are cleared once fields become valid. The submit button will be inactive until the form is valid.
            </p>
            <p>The logic code for this example lives in <code>src/users/logic.js</code>. The logic middleware setup and runtime dependencies injected into logic are in <code>src/configureStore.js</code>
            </p>
          </div>

          <div className="main">
            <Users fields={userFields} errors={validationErrors}
                   valid={fieldsValid} message={message}
                   list={userList}
                   onFieldChange={usersFieldUpdated}
                   onSubmit={usersAdd}  />
          </div>
        </div>
      </div>
  );
}

const enhance = connect(
  state => ({
    userFields: userSel.fields(state),
    validationErrors: userSel.errors(state),
    fieldsValid: userSel.valid(state),
    message: userSel.message(state),
    userList: userSel.list(state)
  }),
  {
    usersFieldUpdated,
    usersAdd
  }
);

export default enhance(App);

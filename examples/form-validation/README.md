# Form Validation

This is an example of using redux-logic for form validation. The validation logic has access to the entire state tree to determine validity. If valid it will allow the USER_FIELDS_UPDATED action to pass through, otherwise it will instead reject with a USER_FIELDS_INVALID action containing both the errors and the field update.

The reducers will be listening for these two actions and will be able to update the UI accordingly. Since we have split out the business logic of validation into the `src/users/logic.js`, the reducers can just focus on updating state.

When the form is valid and ready to submit, we dispatch an action of USER_ADD, the userAddLogic picks up that request, does one more validation for good measure, then calls the server API. If the response from the server was successful then it will update the user list and display the new users.

Note: we are using reqres.in for our simulated server, so it doesn't actually store the data but it provides a valid response that a typical REST server would provide.

It builds action creators and reducers without using any helper libraries.

Finally we are also showcasing that runtime dependencies can be injected rather than hard coded into your logic. So while I could have used axios directly in this code, by injecting it I can now easily mock it out when testing. Axios is injected in the `src/configureStore.js` where we create our logic middleware.


```js
// in src/users/logic.js
import { createLogic } from 'redux-logic';

/**
 * Core business validation code, extracted so it can be used
 * in multiple places and even tested independently
 * @returns errors array
 */
export function validateFields(fields) {
  const errors = [];
  if (!fields.first_name) { errors.push('First name is required'); }
  if (!fields.last_name) { errors.push('Last name is required'); }
  return errors;
}

/**
 Checks that the updated user is valid. If valid then it allows the
 USERS_FIELD_UPDATED action to go through, otherwise it sends a
 USERS_FIELD_INVALID action with errors and the update.
 Reducers will watch for these actions to know how to update the
 UI state, the won't have to deal with validation logic since that
 is handled here.
 */
export const usersUpdateValidationLogic = createLogic({
  type: USERS_FIELD_UPDATED,
  validate({ getState, action }, allow, reject) {
    const state = getState();
    const fields = userSel.fields(state); // use selector to find fields
    const fieldUpdate = action.payload;
    // let's get all the current fields and this update
    // and we can see if this is going to pass our all field validation
    const updatedFields = {
      ...fields,
      [fieldUpdate.name]: fieldUpdate.value
    };
    // validating
    const errors = validateFields(updatedFields);
    if (!errors.length) {
      allow(action); // no errors, let USERS_FIELD_UPDATED go through
    } else { // errors, send a USERS_FIELD_INVALID action instead
      reject(usersFieldInvalid(errors, fieldUpdate));
    }
  }
});

/**
 * Validate state once again and if valid
 * use axios to post to a server.
 * Dispatch USERS_ADD_SUCCESS or USERS_ADD_FAILED
 * based on the response from the server.
 * Note: axios was injected as httpClient in
 * src/configureStore.js
 */
export const usersAddLogic = createLogic({
  type: USERS_ADD,
  validate({ getState, action }, allow, reject) {
    const state = getState();
    const fields = userSel.fields(state);
    const errors = validateFields(fields);
    if (!errors.length) {
      allow(action); // no errors, let USERS_ADD go through
    } else { // still has errors
      // it really should never get here since user shouldn't
      // be able to submit until valid.
      // Errors should already be on screen so just reject silently
      reject();
    }
  },

  // if it passed the validation hook then this will be executed
  process({ httpClient, getState }, dispatch, done) {
    const state = getState();
    const fields = userSel.fields(state);
    httpClient.post('http://reqres.in/api/users', fields)
      .then(resp => resp.data) // new user created is returned
      .then(user => dispatch(usersAddSuccess(user)))
      .catch(err => {
        console.error(err); // might be a render err
        dispatch(usersAddFailed(err))
      })
      .then(() => done()); // call when done dispatching
  }
});
```

## Files of interest

 - [src/configureStore.js](./src/configureStore.js) - logicMiddleware is created with the combined array of logic for the app. Also the dependencies are defined that will be made available to all logic, so axios is defined as httpClient.

 - [src/rootLogic.js](./src/rootLogic.js) - combines logic from all other parts of the app and defines the order they appear in the logic pipeline. Shows how you can structure large apps to easily combine logic.

 - [src/users/logic.js](./src/users/logic.js) - the logic specific to the users part of the app, this contains our async fetch logic

 - [src/users/actions.js](./src/users/actions.js) - contains the action creators

 - [src/users/reducer.js](./src/users/reducer.js) - contains a reducer which handles all the users specific state. Also contains the users related selectors. By collocating the reducer and the selectors we only have to update this one file to change the shape of our reducer state.

 - [src/users/component.js](./src/users/component.js) - Users React.js component for displaying the status, fetch + cancel buttons, and the list of users

 - [src/App.js](./src/App.js) - App component which uses redux connect to provide the users state and bound action handlers as props

 - [test/users-field-updated-logic.spec.js](./test/users-field-updated-logic.spec.js) - testing usersFieldUpdated logic in isolation

## Usage

```bash
npm install # install dependencies
npm start # builds and runs dev server
```

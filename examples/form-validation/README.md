# Form Validation

This is an example of using redux-logic for form validation. The validation logic has access to the entire state tree to determine validity. If valid it will allow the USER_FIELDS_UPDATED action to pass through, otherwise it will instead reject with a USER_FIELDS_INVALID action containing both the errors and the field update.

The reducers will be listening for these two actions and will be able to update the UI accordingly.

It builds action creators and reducers without using any helper libraries.

Finally we are also showcasing that runtime dependencies can be injected rather than hard coded into your logic. So while I could have used axios directly in this code, by injecting it I can now easily mock it out when testing.


```js
// in src/users/actions.js
export const usersFieldUpdated = (evt) => ({
  type: USERS_FIELD_UPDATED,
  payload: {
    name: evt.target.name || evt.target.id,
    value: evt.target.value
  }
});

export const usersFieldInvalid = (errors, fieldUpdate) => ({
  type: USERS_FIELD_INVALID,
  payload: {
    errors,
    fieldUpdate
  }
});

// in src/users/logic.js

/**
 Checks that the updated user is valid. If valid then it allows the
 USERS_FIELD_UPDATED action to go through, otherwise it sends a
 USERS_FIELD_INVALID action with errors and the update.
 Reducers will watch for these actions to know how to update the UI state
 */
export const usersUpdateValidationLogic = createLogic({
  type: USERS_FIELD_UPDATED,
  validate({ getState, action }, allow, reject) {
    const state = getState();
    const fields = userSel.fields(state); // use selector to find fields
    const fieldUpdate = action.payload;
    const updatedFields = {
      ...fields,
      [fieldUpdate.name]: fieldUpdate.value
    };
    // validating
    const errors = [];
    if (!updatedFields.first_name) { errors.push('First name is required'); }
    if (!updatedFields.last_name) { errors.push('Last name is required'); }
    if (!errors.length) {
      allow(action); // no errors, let USERS_FIELD_UPDATED go through
    } else { // errors, send a USERS_FIELD_INVALID action instead
      reject(usersFieldInvalid(errors, fieldUpdate));
    }
  }
});
```

## Files of interest

 - `src/configureStore.js` - logicMiddleware is created with the combined array of logic for the app. Also the dependencies are defined that will be made available to all logic, so axios is defined as httpClient.

 - `src/rootLogic.js` - combines logic from all other parts of the app and defines the order they appear in the logic pipeline. Shows how you can structure large apps to easily combine logic.

 - `src/users/logic.js` - the logic specific to the users part of the app, this contains our async fetch logic

 - `src/users/actions.js` - contains the action creators

 - `src/users/reducer.js` - contains a reducer which handles all the users specific state. Also contains the users related selectors. By collocating the reducer and the selectors we only have to update this one file to change the shape of our reducer state.

 - `src/users/component.js` - Users React.js component for displaying the status, fetch + cancel buttons, and the list of users

 - `src/App.js` - App component which uses redux connect to provide the users state and bound action handlers as props

 - `test/users-field-updated-logic.spec.js` - testing usersFieldUpdated logic in isolation

## Usage

```bash
npm start # builds and runs dev server
```

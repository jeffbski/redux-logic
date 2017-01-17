import { createLogic } from 'redux-logic';
import { USERS_FIELD_UPDATED, USERS_ADD, usersFieldInvalid,
         usersAddSuccess, usersAddFailed } from './actions';
import { selectors as userSel } from './reducer';


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
 Reducers will watch for these actions to know how to update the UI state, the won't have to deal with validation logic since that is handled here.
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
    httpClient.post('https://reqres.in/api/users', fields)
      .then(resp => resp.data) // new user created is returned
      .then(user => dispatch(usersAddSuccess(user)))
      .catch(err => {
        console.error(err); // might be a render err
        dispatch(usersAddFailed(err))
      })
      .then(() => done()); // call when done dispatching
  }
});

export default [
  usersUpdateValidationLogic,
  usersAddLogic
];

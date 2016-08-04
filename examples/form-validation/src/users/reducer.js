import { key, USERS_FIELD_UPDATED, USERS_FIELD_INVALID,
         USERS_ADD_SUCCESS, USERS_ADD_FAILED } from './actions';

export const selectors = {
  fields: state => state[key].fields,
  errors: state => state[key].errors,
  valid: state => state[key].valid,
  message: state => state[key].message,
  list: state => state[key].list
};

const initialState = {
  fields: {
    first_name: '',
    last_name: ''
  },
  errors: [],
  valid: false,
  message: '',
  list: [{ id: 1, first_name: 'Jed', last_name: 'Smith'}]
};

/*
 Since our business logic validation is being handled in src/users/logic.js'
 we can just focus on updating the state here in the reducer.
 */

export default function reducer(state = initialState, action) {
  switch(action.type) {
  case USERS_FIELD_UPDATED:
    { // updates fields and clears errors
      const fieldUpdate = action.payload;
      const updatedFields = {
          ...state.fields,
        [fieldUpdate.name]: fieldUpdate.value
      };
      return {
          ...state,
        fields: updatedFields,
        errors: [],
        valid: true,
        message: ''
      };
    }
  case USERS_FIELD_INVALID:
    { // updates fields but displays errors
      const { errors, fieldUpdate } = action.payload;
      const updatedFields = {
          ...state.fields,
        [fieldUpdate.name]: fieldUpdate.value
      };
      return {
          ...state,
        fields: updatedFields,
        errors: errors,
        valid: false,
        message: ''
      };
    }
  case USERS_ADD_SUCCESS:
    { // add user to list, update message
      const user = action.payload;
      return {
        ...state,
        fields: { first_name: '', last_name: '' },
        errors: [],
        valid: false,
        message: 'user added successfully',
        list: state.list.concat(user)
      };
    }
  case USERS_ADD_FAILED:
    { // failed to add to server, display error
      const err = action.payload;
      return {
        ...state,
        errors: state.errors.concat(err.message),
        message: ''
      };
    }
  default:
    return state;
  }
}

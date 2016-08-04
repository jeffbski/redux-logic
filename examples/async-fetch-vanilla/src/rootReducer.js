import { combineReducers } from 'redux';
import { key as usersKey,
         reducer as usersReducer } from './users/index';

export default combineReducers({
  [usersKey]: usersReducer
});

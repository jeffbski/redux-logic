import { combineReducers } from 'redux';
import { key as notifyKey,
         reducer as notifyReducer } from './notify/index';

export default combineReducers({
  [notifyKey]: notifyReducer
});

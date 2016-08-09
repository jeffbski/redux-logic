import { combineReducers } from 'redux';
import { key as timerKey,
         reducer as timerReducer } from './timer/index';

export default combineReducers({
  [timerKey]: timerReducer
});

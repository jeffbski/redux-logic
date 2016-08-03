import { combineReducers } from 'redux';
import { key as pollsKey,
         reducer as pollsReducer } from './polls/index';

export default combineReducers({
  [pollsKey]: pollsReducer
});

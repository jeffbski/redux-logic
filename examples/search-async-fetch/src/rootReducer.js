import { combineReducers } from 'redux';
import { key as searchKey,
         reducer as searchReducer } from './search/index';

export default combineReducers({
  [searchKey]: searchReducer
});

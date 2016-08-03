/* global devToolsExtension:false */

import axios from 'axios';
import { compose, createStore, applyMiddleware } from 'redux';
import { createLogicMiddleware } from 'redux-logic';
import rootReducer  from './rootReducer';
import logic from './rootLogic';

const deps = { // injected dependencies for logic
  httpClient: axios
};

const logicMiddleware = createLogicMiddleware(logic, deps);

const middleware = applyMiddleware(
  logicMiddleware
);


// using compose to allow for applyMiddleware, just add it in
const enhancer = (typeof devToolsExtension !== 'undefined') ?
      compose(
        middleware,
        devToolsExtension()
      ) :
      middleware;

export default function configureStore() {
  const store = createStore(rootReducer, enhancer);
  return store;
}

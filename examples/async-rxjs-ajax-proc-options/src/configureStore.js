/* global devToolsExtension:false */

import { compose, createStore, applyMiddleware } from 'redux';
import { createLogicMiddleware } from 'redux-logic';
import rootReducer  from './rootReducer';
import logic from './rootLogic';

import { ajax } from 'rxjs/ajax';

// selectively just getting ajax and map from rxjs to keep size smaller
// be sure to add everything you need in your logic
// import 'rxjs/Observable';
// import 'rxjs/add/operator/catch';
// import 'rxjs/add/operator/map';
// import { ajax } from 'rxjs/observable/dom/ajax';

const deps = { // injected dependencies for logic
  httpClient: ajax.getJSON // RxJS ajax
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

# redux-logic

Redux middleware for organizing business logic and action side effects. Inspired by Epics (redux-observable), Sagas, and raw middleware.

It's like Epics (w/o the rxjs/Observables) with added power of raw middleware to do validations, verifications, auth, transformations.

## Goals

 - organize business logic keeping action creators and reducers clean
   - action creators are light and just post action objects
   - reducers only deal with updating the state
 - cancellable async work - ajax, REST, web socket, ... Cancel simply by dispatching a cancel action
 - supports taking only the latest, throttling, and debouncing
 - perform validations, verifications, authentication
 - perform transformations
 - perform async work, dispatch actions
 - have access to full state to make decisions
 - dynamic loading of epics
 - create subscriptions - streaming updates
 - observables optional - supports observables but they are not needed for most use cases
 - program with simple familiar JS code, don't use generators or observables unless you want to
 - easily composable to support large applications
 - inject dependencies and/or config into your epics

## Compared to redux-observable

 - redux-logic doesn't require the developer to use rxjs observables. It has used observables under the covers to provide cancellation, throttling, etc. You simply configure these parameters to get this functionality. You can still use rxjs in your code if you want, but not a requirement.
 - redux-logic hooks in before the reducer stack like middleware allowing validation, verification, auth, tranformations. Allow, reject, tranform actions before they hit your reducers to update your state

## Compared to redux-saga

 - redux-logic doesn't require you to code with generators
 - redux-saga relies on pulling data (usually in a never ending loop) while redux-logic and epics are reactive, responding to data as it is available
 - redux-saga doesn't support dynamic loading of code

## Compared to redux-thunk

 - With thunks business logic is spread over action creators
 - With thunks there is not an easy way to cancel async work nor to perform limiting (take latest, throttling, debouncing)

## Compared to raw redux middleware

 - Both are fully featured to do any type of business logic (validations, tranformations, processing)
 - redux-logic already has built-in the hard stuff like cancellation and limiting, dynamic loading of code

## Compared to SAM or PAL Pattern

 - With redux-logic you can implement the major missing functionality of the SAM / PAL pattern without giving up React and Redux. Namely you can separate out your business logic from your action creators and reducers keeping them each clean. You have the ability to accept, reject, and transform actions before your reducers are run.
 - If you implement SAM / PAL without React/Redux you will have lots of boilerplate to implement.

## Usage

```js
// in configureStore.js
import { createEpicMiddleware } from './redux-logic';
import rootReducer, { epics } from './rootReducer';

const deps = { // injected dependencies for epics
  a: 1,
  b: 2
};

const epicMiddleware = createEpicMiddleware(epics, deps);

const middleware = applyMiddleware(
  epicMiddleware
);

const enhancer = middleware; // could compose in dev tools too

export default function configureStore() {
  const store = createStore(rootReducer, enhancer);
  return store;
}


// in rootReducer.js
export const epics = [
 ...todoEpics,
 ...pollsEpics
];


// in polls/epics.js

const validationEpic = createEpic({
  type: ADD_USER,
  validate({ getState, action }, allow, reject) {
    const user = action.payload;
    if (!getState().users[user.id]) { // can also hit server to check
      allow(action);
    } else {
      reject({ type: USER_EXISTS_ERROR, payload: user, error: true })
    }
  }
});

const addUniqueId = createEpic({
  transform({ getState, action }, next) {
    // add unique tid to action.meta of every action
    const existingMeta = action.meta || {};
    const meta = {
      ...existingMeta,
      tid: shortid.generate()
    },
    next({
      ...action,
      meta
    });
  }
});

const fetchPollsEpic = createEpic({
  type: FETCH_POLLS, // this epic is only for type FETCH_POLLS
  cancelType: CANCEL_FETCH_POLLS, // cancel on this type
  latest: true, // only take latest
  process({ getState, action }, dispatch) {
    axios.get('https://survey.codewinds.com/polls')
      .then(resp => resp.data.polls)
      .then(polls => dispatch({ type: FETCH_POLLS_SUCESS,
                                payload: polls }))
      .catch(({ statusText }) =>
             dispatch({ type: FETCH_POLLS_FAILED, payload: statusText,
                        error: true })

  }
});

export default [
  validationEpic,
  addUniqueId,
  fetchPollsEpic
];

```

## Full API

```js
createEpic({
  // filtering/cancelling
  type, // string, regex, array of strings or regexes
  cancelType, // string, regex, array of strings or regexes

  // limiting
  latest, // only take latest, default false
  debounce, // debounce for N ms, default 0
  throttle, // throttle for N ms, default 0

  // execution phases, define one or more
  validate({ getState, action }, allow, reject) {}

  transform({ getState, action }, next) {}

  process({ getState, action, cancelled$ }, dispatch) {}
});

createEpicMiddleware(
  epics, // array of epics
  deps   // optional injected deps/config, supplied to epics
);

// dynamically add epics, keeping epic state
epicMiddleware.addEpics(epics);

// replacing epics, epic state is reset but epics should still finish
epicMiddleware.replaceEpics(epics);
```

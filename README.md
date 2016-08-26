# redux-logic

Redux middleware for organizing business logic and action side effects.

> "I wrote the rxjs code so you won't have to."

[![Build Status](https://secure.travis-ci.org/jeffbski/redux-logic.png?branch=master)](http://travis-ci.org/jeffbski/redux-logic) [![Codacy Grade Badge](https://img.shields.io/codacy/grade/3687e7267e6d466b9d226c22b24f0061.svg)](https://www.codacy.com/app/jeff-barczewski/redux-logic) [![Codacy Coverage Badge](https://img.shields.io/codacy/coverage/3687e7267e6d466b9d226c22b24f0061.svg)](https://www.codacy.com/app/jeff-barczewski/redux-logic) [![NPM Version Badge](https://img.shields.io/npm/v/redux-logic.svg)](https://www.npmjs.com/package/redux-logic)


You declare some behavior that wraps your code providing things like filtering, cancelation, limiting, etc., then write just the simple business logic code that runs in the center.

Inspired by redux-observable epics, redux-saga, and custom redux middleware.

## tl;dr

One place to keep all of your business logic and side effects with redux

With simple code you can:

 - validate, verify, auth check actions and allow/reject or modify actions
 - transform - augment/enhance/modify actions
 - process - async processing and dispatching, orchestration, I/O (ajax, REST, web sockets, ...)

Built-in declarative functionality

 - filtering, cancellation, takeLatest, throttling, debouncing


## Quick Example

This is an example of logic which will listen for actions of type FETCH_POLLS and it will perform ajax request to fetch data for which it dispatches the results (or error) on completion. It supports cancellation by allowing anything to send an action of type CANCEL_FETCH_POLLS. It also uses `take latest` feature that if additional FETCH_POLLS actions come in before this completes, it will ignore the outdated requests.

The developer can just declare the type filtering, cancellation, and take latest behavior, no code needs to be written for that. That leaves the developer to focus on the real business requirements which are invoked in the process hook.

```js
const fetchPollsLogic = createLogic({

  // declarative built-in functionality wraps your code
  type: FETCH_POLLS, // only apply this logic to this type
  cancelType: CANCEL_FETCH_POLLS, // cancel on this type
  latest: true, // only take latest

  // your code here, hook into one or more of these execution
  // phases: validate, transform, and/or process
  process({ getState, action }, dispatch) {
    axios.get('https://survey.codewinds.com/polls')
      .then(resp => resp.data.polls)
      .then(polls => dispatch({ type: FETCH_POLLS_SUCCESS,
                                payload: polls }))
      .catch(({ statusText }) =>
             dispatch({ type: FETCH_POLLS_FAILED, payload: statusText,
                        error: true })

  }
});
```

## Table of contents

 - <a href="#goals">Goals</a>
 - <a href="#usage">Usage</a>
 - <a href="./docs/api.md">Full API</a>
 - <a href="#examples">Examples</a> - [JSFiddle](#jsfiddle-live-examples) and [full examples](#full-examples)
 - <a href="#comparison-summaries">Comparison summaries</a> to <a href="#compared-to-fat-action-creators">fat action creators</a>, <a href="#compared-to-redux-thunk">thunks</a>, <a href="#compared-to-redux-observable">redux-observable</a>, <a href="#compared-to-redux-saga">redux-saga</a>, <a href="#compared-to-custom-redux-middleware">custom middleware</a>
 - <a href="#implementing-sampal-pattern">SAM/PAL pattern</a>
 - <a href="#other">Other</a> - todo, inspiration, license

## Goals

 - organize business logic keeping action creators and reducers clean
   - action creators are light and just post action objects
   - reducers just focus on updating state
   - intercept and perform validations, verifications, authentication
   - intercept and transform actions
   - perform async processing, orchestration, dispatch actions
 - wrap your core business logic code with declarative behavior
   - filtered - apply to one or many action types or even all actions
   - cancellable - async work can be cancelled
   - limiting (like taking only the latest, throttling, and debouncing)
 - features to support business logic and large apps
   - have access to full state to make decisions
   - easily composable to support large applications
   - inject dependencies into your logic, so you have everything needed in your logic code
   - dynamic loading of logic for splitting bundles in your app
   - your core logic code stays focussed and simple, don't use generators or observables unless you want to.
   - create subscriptions - streaming updates
   - easy testing - since your code is just a function it's easy to isolate and test


## Usage

```bash
npm install redux-logic --save
```

```js
// in configureStore.js
import { createLogicMiddleware } from 'redux-logic';
import rootReducer from './rootReducer';
import arrLogic from './logic';

const deps = { // optional injected dependencies for logic
  // anything you need to have available in your logic
  A_SECRET_KEY: 'dsfjsdkfjsdlfjls',
  firebase: firebaseInstance
};

const logicMiddleware = createLogicMiddleware(arrLogic, deps);

const middleware = applyMiddleware(
  logicMiddleware
);

const enhancer = middleware; // could compose in dev tools too

export default function configureStore() {
  const store = createStore(rootReducer, enhancer);
  return store;
}


// in logic.js - combines logic from across many files, just
// a simple array of logic to be used for this app
export default [
 ...todoLogic,
 ...pollsLogic
];


// in polls/logic.js

const validationLogic = createLogic({
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

const addUniqueId = createLogic({
  type: '*',
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

const fetchPollsLogic = createLogic({
  type: FETCH_POLLS, // only apply this logic to this type
  cancelType: CANCEL_FETCH_POLLS, // cancel on this type
  latest: true, // only take latest
  process({ getState, action }, dispatch) {
    axios.get('https://survey.codewinds.com/polls')
      .then(resp => resp.data.polls)
      .then(polls => dispatch({ type: FETCH_POLLS_SUCCESS,
                                payload: polls }))
      .catch(({ statusText }) =>
             dispatch({ type: FETCH_POLLS_FAILED, payload: statusText,
                        error: true })

  }
});

// pollsLogic
export default [
  validationLogic,
  addUniqueId,
  fetchPollsLogic
];

```

### processOptions introduced for redux-logic@0.8.2 allowing for even more streamlined code

`processOptions` has these new properties which affect the process hook behavior:

 - `dispatchReturn` - the returned value of the process function will be dispatched or if it is a promise or observable then the resolve, reject, or observable values will be dispatched applying any successType or failType logic if defined. Default: `false`.
 - `successType` - dispatch this action type using contents of dispatch as the payload (also would work with with promise or observable). You may alternatively provide an action creator function to use instead. Deafult: `undefined`.
 - `failType` - dispatch this action type using contents of error as the payload, sets error: true (would also work for rejects of promises or error from observable). You may alternatively provide an action creator function to use instead. Default: `undefined`.

The successType and failType would enable clean code, where you can simply return a promise or observable that resolves to the payload and rejects on error. The resulting code doesn't have to deal with dispatch and actions directly.

```js
const fetchPollsLogic = createLogic({

  // declarative built-in functionality wraps your code
  type: FETCH_POLLS, // only apply this logic to this type
  cancelType: CANCEL_FETCH_POLLS, // cancel on this type
  latest: true, // only take latest

  processOptions: {
    dispatchReturn: true, // use returned/resolved value(s) for dispatching
    // provide action types or action creator functions to be used
    // with the resolved/rejected values from promise/observable returned
    successType: FETCH_POLLS_SUCCESS, // dispatch this success act type
    failType: FETCH_POLLS_FAILED, // dispatch this failed action type
  },

  // dispatchReturn option allows you to simply return obj, promise, obs
  // not needing to use dispatch directly
  process({ getState, action }) {
    return axios.get('https://survey.codewinds.com/polls')
      .then(resp => resp.data.polls);
    )
  }
});
```

This is pretty nice leaving us with mainly our business logic code that could be easily extracted and called from here.


## Full API

See the [docs for the full api](./docs/api.md)

## Examples

### JSFiddle live examples

 - [search async axios fetch](http://jsfiddle.net/jeffbski/78vpf92k/) - live search using debounce and take latest functionality with axios fetch
 - [search rxjs ajax fetch](http://jsfiddle.net/jeffbski/uLh2add5/) - live search using debounce and take latest functionality with rxjs ajax fetch
 - [search rxjs ajax fetch - using processOptions](http://jsfiddle.net/jeffbski/rLz44jk9/) - live search using debounce and take latest with rxjs ajax fetch using processOptions to streamline the code
 - [async axios fetch - single page](http://jsfiddle.net/jeffbski/954g5n7h/) - displayed using React
 - [async rxjs-ajax fetch](http://jsfiddle.net/jeffbski/0fu407na/) - async fetching using RxJS ajax which supports XHR abort for cancels
 - [async axios fetch - single page redux only](http://jsfiddle.net/jeffbski/yzy8w4ve/) - just the redux and redux-logic code
 - [async axios fetch - using processOptions](http://jsfiddle.net/jeffbski/oL6jmp52/) - using processOptions to streamline your code further with React
 - [async rxjs-ajax fetch - using processOptions](http://jsfiddle.net/jeffbski/d4p6oo0d/) - async fetch using RxJS ajax (supporting XHR abort on cancel) and processOptions for clean code.
 - [async await - react](http://jsfiddle.net/jeffbski/rfc7oz9p/) - using ES7 async functions (async/await) displaying with React
 - [async await - redux only](http://jsfiddle.net/jeffbski/h485f6h5/) - using ES7 async functions (async/await) - just redux and redux-logic code
 - [async await - react processOptions](http://jsfiddle.net/jeffbski/0rodyekn/) - using ES7 async functions (async/await) with processOptions, displayed with React

### Full examples

 - [search-async-fetch](./examples/search-async-fetch) - search async fetch example using axios uses debouncing and take latest features
 - [async-fetch-vanilla](./examples/async-fetch-vanilla) - async fetch example using axios
 - [async-rxjs-ajax-fetch](./examples/async-rxjs-ajax-fetch) - async fetch example using RxJS ajax (supporting XHR abort on cancel) and redux-actions
 - [async-fetch-proc-options](./examples/async-fetch-proc-options) - async fetch example using axios and the new processOptions feature
 - [async-rxjs-ajax-proc-options](./examples/async-rxjs-ajax-proc-options) - async RxJS ajax (with XHR abort on cancel) fetch example using axios and the new processOptions feature
 - [async-await - ES7 async functions](./examples/async-await) - async fetch example using axios and ES7 async functions (async/await)
 - [async-await - ES7 async functions with processOptions](./examples/async-await-proc-options) - async fetch example using axios and ES7 async functions (async/await) and using the new processOptions feature
 - [countdown](./examples/countdown) - a countdown timer implemented with setInterval
 - [countdown-obs](./examples/countdown-obs) - a countdown timer implemented with Rx.Observable.interval
 - [form-validation](./examples/form-validation) - form validation and async post to server using axios, displays updated user list
 - [notification](./examples/notification) - notification message example showing at most N messages for X amount of time, rotating queued messages in as others expire
 - [search-single-file](./examples/single-file) - search async fetch example with all code in a single file and displayed with React
 - [single-file-redux](./examples/single-file-redux) - async fetch example with all code in a single file and appended to the container div. Only redux and redux-logic code.


## Comparison summaries

Following are just short summaries to compare redux-logic to other approaches.

For a more detailed comparison with examples, see by article in docs, [Where do I put my business logic in a React-Redux application?](./docs/where-business-logic.md).


### Compared to fat action creators

 - no easy way to cancel or do limiting like take latest with fat action creators
 - action creators would not have access to the full global state so you might have to pass down lots of extra data that isn't needed for rendering. Every time business logic changes might require new data to be made available
 - no global interception using just action creators - applying logic or transformations across all or many actions
 -  Testing components and fat action creators may require running the code (possibly mocked API calls).

### Compared to redux-thunk

 - With thunks business logic is spread over action creators
 - With thunks there is not an easy way to cancel async work nor to perform (take latest) limiting
 - no global interception with thunks - applying logic or transformations across all or many actions
 - Testing components and thunked action creators may require running the code (possibly mocked API calls). When you have a thunk (function or promise) you don't know what it does unless you execute it.


### Compared to redux-observable

 - redux-logic doesn't require the developer to use rxjs observables. It uses observables under the covers to provide cancellation, throttling, etc. You simply configure these parameters to get this functionality. You can still use rxjs in your code if you want, but not a requirement.
 - redux-logic hooks in before the reducer stack like middleware allowing validation, verification, auth, tranformations. Allow, reject, tranform actions before they hit your reducers to update your state as well as accessing state after reducers have run. redux-observable hooks in after the reducers have updated state so they have no opportuntity to prevent the updates.

### Compared to redux-saga

 - redux-logic doesn't require you to code with generators
 - redux-saga relies on pulling data (usually in a never ending loop) while redux-logic and logic are reactive, responding to data as it is available
 - redux-saga runs after reducers have been run, redux-logic can intercept and allow/reject/modify before reducers run also as well as after


### Compared to custom redux middleware

 - Both are fully featured to do any type of business logic (validations, tranformations, processing)
 - redux-logic already has built-in capabilities for some of the hard stuff like cancellation, limiting, dynamic loading of code. With custom middleware you have to implement all functionality.
 - No safety net, if things break it could stop all of your future actions
 - Testing requires some mocking or setup

### Implementing SAM/PAL Pattern

The [SAM (State-Action-Model) pattern](http://sam.js.org) is a pattern introduced by Jean-Jacques Dubray. Also known as the PAL (proposer, acceptor, learner) pattern based on Paxos terminology.

A few of the challenging parts of implementing this with a React-Redux application are:

 1. where to perform the `accept` (interception) of the proposed action performing validation, verification, authentication against the current model state. Based on the current state, it might be appropriate to modify the action, dispatch a different action, or simply suppress the action.
 2. how to trigger actions based on the state after the model has finished updating, referred to as the `NAP` (next-action-predicate).

Custom Redux middleware can be introduced to perform this logic, but you'll be implementing most everything on your own.

With `redux-logic` you can implement the SAM / PAL pattern easily in your React/Redux apps.

Namely you can separate out your business logic from your action creators and reducers keeping them thin. redux-logic provides a nice place to accept, reject, and transform actions before your reducers are run. You have access to the full state to make decisions and you can trigger actions based on the updated state as well.

Solving those SAM challenges previously identified using redux-logic:

 1. perform acceptance in redux-logic `validate` hooks, you have access to the full state (model) of the app to make decisions. You can perform synchronous or asynchronous logic to determine whether to accept the action and you may augment, modify, substitute actions, or suppress as desired.
 2. Perform NAP processing in redux-logic `process` hooks. The process hook runs after the actions have been sent down to the reducers so you have access to the full model (state) after the updates where you can make decisions and dispatch additional actions based on the updated state.

<a name="other"></a>

## Inspiration

redux-logic was inspired from these projects:

 - [redux-observable epics](https://redux-observable.js.org)
 - [redux-saga](http://yelouafi.github.io/redux-saga/)
 - [redux middleware](http://redux.js.org/docs/advanced/Middleware.html)

## Minimized/gzipped size with all deps

(redux-logic only includes the modules of RxJS 5 that it uses)
```
redux-logic.min.js.gz 11KB
```

Note: If you are already including RxJS 5 into your project then the resulting delta will be much smaller.

## TODO

 - add typescript support
 - more docs
 - more examples
 - evaulate additional features as outlined above

## Get involved

If you have input or ideas or would like to get involved, you may:

 - contact me via twitter @jeffbski  - <http://twitter.com/jeffbski>
 - open an issue on github to begin a discussion - <https://github.com/jeffbski/redux-logic/issues>
 - fork the repo and send a pull request (ideally with tests) - <https://github.com/jeffbski/redux-logic>
 - See the [contributing guide](http://github.com/jeffbski/redux-logic/raw/master/CONTRIBUTING.md)


<a name="license"/>

## License - MIT

 - [MIT license](http://github.com/jeffbski/redux-logic/raw/master/LICENSE.md)

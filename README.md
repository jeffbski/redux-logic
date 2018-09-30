# redux-logic

> "One place for all your business logic and action side effects"

Redux middleware that can:

 - **intercept** (validate/transform/augment) actions AND
 - **perform async processing** (fetching, I/O, side effects)

[![Build Status](https://secure.travis-ci.org/jeffbski/redux-logic.png?branch=master)](http://travis-ci.org/jeffbski/redux-logic) [![Known Vulnerabilities](https://snyk.io/test/github/jeffbski/redux-logic/badge.svg)](https://snyk.io/test/github/jeffbski/redux-logic) [![NPM Version Badge](https://img.shields.io/npm/v/redux-logic.svg)](https://www.npmjs.com/package/redux-logic)

## tl;dr

With redux-logic, you have the **freedom** to write your logic in **your favorite JS style**:

 - plain **callback** code - `dispatch(resultAction)`
 - **promises** - `return axios.get(url).then(...)`
 - **async/await** - `result = await fetch(url)`
 - **observables** - `ob$.next(action1)`

> Use the type of code you and your team are comfortable and experienced with.

Leverage powerful **declarative** features by simply setting properties:

 - **filtering** for action type(s) or with regular expression(s)
 - **cancellation** on receiving action type(s)
 - use only response for the **latest** request
 - **debouncing**\
 - **throttling**
 - dispatch actions - auto **decoration** of payloads

Testing your logic is straight forward and simple. [redux-logic-test](https://github.com/jeffbski/redux-logic-test) provides additional utilities to make testing a breeze.

With simple code your logic can:

 - **intercept** actions before they hit the reducer
   - **validate**, verify, auth check actions and allow/reject or modify actions
   - **transform** - augment/enhance/modify actions
 - **process** - **async processing** and dispatching, orchestration, I/O (ajax, REST, subscriptions, GraphQL, web sockets, ...)

Redux-logic makes it easy to use code that is split into bundles, so you can dynamically load logic right along with your split UI.

Server rendering is simplified with redux-logic since it lets you know when all your async fetching is complete without manual tracking.

Inspired by redux-observable epics, redux-saga, and custom redux middleware, redux-logic combines ideas of each into a simple easy to use API.


## Quick Example

This is an example of logic which will listen for actions of type FETCH_POLLS and it will perform ajax request to fetch data for which it dispatches the results (or error) on completion. It supports cancellation by allowing anything to send an action of type CANCEL_FETCH_POLLS. It also uses `take latest` feature that if additional FETCH_POLLS actions come in before this completes, it will ignore the outdated requests.

The developer can just declare the type filtering, cancellation, and take latest behavior, no code needs to be written for that. That leaves the developer to focus on the real business requirements which are invoked in the process hook.

```js
import { createLogic } from 'redux-logic';

const fetchPollsLogic = createLogic({

  // declarative built-in functionality wraps your code
  type: FETCH_POLLS, // only apply this logic to this type
  cancelType: CANCEL_FETCH_POLLS, // cancel on this type
  latest: true, // only take latest

  // your code here, hook into one or more of these execution
  // phases: validate, transform, and/or process
  process({ getState, action }, dispatch, done) {
    axios.get('https://survey.codewinds.com/polls')
      .then(resp => resp.data.polls)
      .then(polls => dispatch({ type: FETCH_POLLS_SUCCESS,
                                payload: polls }))
      .catch(err => {
             console.error(err); // log since could be render err
             dispatch({ type: FETCH_POLLS_FAILED, payload: err,
                        error: true })
      })
      .then(() => done()); // call done when finished dispatching
  }
});
```

Since redux-logic gives you the freedom to use your favorite style of JS code (callbacks, promises, async/await, observables), it supports many features to make that easier, [explained in more detail](./docs/api.md#dispatch---multi-dispatching-and-process-variable-signature)


## Table of contents

 - <a href="#updates">Updates</a>
 - <a href="#goals">Goals</a>
 - <a href="#usage">Usage</a>
 - <a href="./docs/api.md">Full API</a>
 - <a href="#examples">Examples</a> - [Live](#live-examples) and [full examples](#full-examples)
 - <a href="#comparison-summaries">Comparison summaries</a> to <a href="#compared-to-fat-action-creators">fat action creators</a>, <a href="#compared-to-redux-thunk">thunks</a>, <a href="#compared-to-redux-observable">redux-observable</a>, <a href="#compared-to-redux-saga">redux-saga</a>, <a href="#compared-to-custom-redux-middleware">custom middleware</a>
 - <a href="#implementing-sampal-pattern">SAM/PAL pattern</a>
 - <a href="#other">Other</a> - todo, inspiration, license

## Updates

Full release notes of breaking and notable changes are available in [releases](https://github.com/jeffbski/redux-logic/releases). This project follows semantic versioning.

A few recent changes that are noteworthy:

### v2.0.0

Updated to RxJS@6. Your logic code can continue to use RxJS@5 until
you are ready to upgrade to 6.

Optimizations to reduce the stack used, especially if a subset of
features is used.

### v1.0.0

Transpilation switched to Babel 7 and Webpack 4

### v0.12

These changes are not breaking but they are noteworthy since they prepare for the next version which will be breaking mainly to remove the single dispatch version of process hook which has been a source of confusion.

  - Single dispatch signature for `process` hook is deprecated and warns in development build. This is when you use the signature `process(deps, dispatch)` (including dispatch but not done). To migrate change your use to include done `process(deps, dispatch, done)` and call the `done` cb when done dispatching.
  - New option `warnTimeout` defaults to 60000 (ms == one minute) which warns (in development build only) when the logic exceeds the specified time without completion. Adjust this value or set it to 0 if you have logic that needs to exceed this time or purposefully never ends (like listening to a web socket)


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

redux-logic uses rxjs@6 under the covers and to prevent multiple copies (of different versions) from being installed, it is recommended to install rxjs first before redux-logic. That way you can use the same copy of rxjs elsewhere.

If you are never using rxjs outside of redux-logic and don't plan to use Observables directly in your logic then you can skip the rxjs install and it will be installed as a redux-logic dependency. However if you think you might use Observables directly in the future (possibly creating Observables in your logic), it is still recommended to install rxjs separately first
just to help ensure that only one copy will be in the project.

The rxjs install below `npm install rxjs@^6` installs the lastest 6.x.x version of rxjs.

```bash
npm install rxjs@^6 --save  # optional see note above
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
import { createLogic } from 'redux-logic';

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
  process({ getState, action }, dispatch, done) {
    axios.get('https://survey.codewinds.com/polls')
      .then(resp => resp.data.polls)
      .then(polls => dispatch({ type: FETCH_POLLS_SUCCESS,
                                payload: polls }))
      .catch(err => {
             console.error(err); // log since could be render err
             dispatch({ type: FETCH_POLLS_FAILED, payload: err,
                        error: true })
      })
      .then(() => done());
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

 - `dispatchReturn` - the returned value of the process function will be dispatched or if it is a promise or observable then the resolve, reject, or observable values will be dispatched applying any successType or failType logic if defined. Default is determined by arity of process fn, `true` if dispatch not provided, `false` otherwise. [Details](https://github.com/jeffbski/redux-logic/blob/master/docs/api.md#dispatch---multi-dispatching-and-process-variable-signature)

 - `successType` - dispatch this action type using contents of dispatch as the payload (also would work with with promise or observable). You may alternatively provide an action creator function to use instead and it will receive the value as only parameter. Default: `undefined`.
   - if successType is a string action type
     - create action using successType and provide value as payload. ex: with `successType:'FOO'`, result would be `{ type: 'FOO', payload: value }`

   - if successType is an action creator fn receiving the value as only parameter
     - use the return value from the action creator fn for dispatching ex: `successType: x => ({ type: 'FOO', payload: x })`
     - if the action creator fn returns a falsey value like `undefined` then nothing will be dispatched. This allows your action creator to control whether something is actually dispatched based on the value provided to it.

 - `failType` - dispatch this action type using contents of error as the payload, sets error: true (would also work for rejects of promises or error from observable). You may alternatively provide an action creator function to use instead which will receive the error as the only parameter. Default: `undefined`.
   - if failType is a string action type
     - create action using failType, provide value as the payload, and set error to true. ex: with `failType:'BAR'`, result would be `{ type: 'BAR', payload: errorValue, error: true }`

   - if failType is an action creator function receiving the error value as its only parameter
     - use the return value from the action creator fn for dispatching. ex: `failType: x => ({ type: 'BAR', payload: x, error: true })`
     - if the action creator fn returns a falsey value like `undefined` then nothing will be dispatched. This allows your action creator to control whether something is actually dispatched based on the value provided to it.

The successType and failType would enable clean code, where you can simply return a promise or observable that resolves to the payload and rejects on error. The resulting code doesn't have to deal with dispatch and actions directly.

```js
import { createLogic } from 'redux-logic';

const fetchPollsLogic = createLogic({

  // declarative built-in functionality wraps your code
  type: FETCH_POLLS, // only apply this logic to this type
  cancelType: CANCEL_FETCH_POLLS, // cancel on this type
  latest: true, // only take latest

  processOptions: {
    // optional since the default is true when dispatch is omitted from
    // the process fn signature
    dispatchReturn: true, // use returned/resolved value(s) for dispatching
    // provide action types or action creator functions to be used
    // with the resolved/rejected values from promise/observable returned
    successType: FETCH_POLLS_SUCCESS, // dispatch this success act type
    failType: FETCH_POLLS_FAILED, // dispatch this failed action type
  },

  // Omitting dispatch from the signature below makes the default for
  // dispatchReturn true allowing you to simply return obj, promise, obs
  // not needing to use dispatch directly
  process({ getState, action }) {
    return axios.get('https://survey.codewinds.com/polls')
      .then(resp => resp.data.polls);
  }
});
```

This is pretty nice leaving us with mainly our business logic code that could be easily extracted and called from here.


## Full API

See the [docs for the full api](./docs/api.md)

## Examples

### Live examples

 - [search async axios fetch](https://codesandbox.io/s/6zv883qnqk) - live search using debounce and take latest functionality with axios fetch
 - [search rxjs ajax fetch](https://codesandbox.io/s/rm16mzz94n) - live search using debounce and take latest functionality with rxjs ajax fetch
 - [search rxjs ajax fetch - using processOptions](https://codesandbox.io/s/lyw0225pr9) - live search using debounce and take latest with rxjs ajax fetch using processOptions to streamline the code, user logic using rxjs@5
 - [search rxjs6 ajax fetch - using processOptions](https://codesandbox.io/s/q7oo6wo2n6) - live search using debounce and take latest with rxjs ajax fetch using processOptions to streamline the code, user logic using rxjs@6
 - [async axios fetch - single page](https://codesandbox.io/s/82xjxx3kp2) - displayed using React
 - [async rxjs-ajax fetch](https://codesandbox.io/s/1o14zmz4rq) - async fetching using RxJS ajax which supports XHR abort for cancels
 - [async axios fetch - single page redux only](https://codesandbox.io/s/2w1lkpq19p) - just the redux and redux-logic code
 - [async axios fetch - using processOptions](https://codesandbox.io/s/4w6r5mvxqx) - using processOptions to streamline your code further with React
 - [async rxjs-ajax fetch - using processOptions](https://codesandbox.io/s/o45z24rpky) - async fetch using RxJS ajax (supporting XHR abort on cancel) and processOptions for clean code.
 - [async await - react](https://codesandbox.io/s/0q0xw8vm6n) - using ES7 async functions (async/await) displaying with React
 - [async await - redux only](https://codesandbox.io/s/742zx6w946) - using ES7 async functions (async/await) - just redux and redux-logic code
 - [async await - react processOptions](https://codesandbox.io/s/64l8xv1po3) - using ES7 async functions (async/await) with processOptions, displayed with React
 - [drag and drop - rxjs@6 - react](https://codesandbox.io/s/n34x5j3jv4) - drag a button using rxjs@6 and the new stream added to redux-logic@v2 `action$`
 - [websockets - rxjs@6 - react](https://codesandbox.io/s/m38l7n745y) - websocket send and receive using rxjs@6 and react

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
 - redux-logic hooks in before the reducer stack like middleware allowing validation, verification, auth, transformations. Allow, reject, transform actions before they hit your reducers to update your state as well as accessing state after reducers have run. redux-observable hooks in after the reducers have updated state so they have no opportunity to prevent the updates.

### Compared to redux-saga

 - redux-logic doesn't require you to code with generators
 - redux-saga relies on pulling data (usually in a never ending loop) while redux-logic and logic are reactive, responding to data as it is available
 - redux-saga runs after reducers have been run, redux-logic can intercept and allow/reject/modify before reducers run also as well as after


### Compared to custom redux middleware

 - Both are fully featured to do any type of business logic (validations, transformations, processing)
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

(redux-logic only includes the modules of RxJS 6 that it uses)
```
redux-logic.min.js.gz 18KB
```

Note: If you are already including RxJS 6 into your project then the resulting delta will be much smaller.

## TODO

 - more docs
 - more examples

## Get involved

If you have input or ideas or would like to get involved, you may:

 - contact me via twitter @jeffbski  - <http://twitter.com/jeffbski>
 - open an issue on github to begin a discussion - <https://github.com/jeffbski/redux-logic/issues>
 - fork the repo and send a pull request (ideally with tests) - <https://github.com/jeffbski/redux-logic>
 - See the [contributing guide](http://github.com/jeffbski/redux-logic/raw/master/CONTRIBUTING.md)

## Supporters

This project is supported by [CodeWinds Training](https://codewinds.com/)


<a name="license"/>

## License - MIT

 - [MIT license](http://github.com/jeffbski/redux-logic/raw/master/LICENSE.md)

# redux-logic API

Contents:

 - [Installation](#installation)
 - [Main usage](#main-usage)
 - [Execution phase hooks](#execution-phase-hooks---validate-transform-process) - [validate](#validate-hook), [transform](#transform-hook), [process](#process-hook)
 - [Advanced usage](#advanced-usage)

## Installation

redux-logic uses rxjs@5 under the covers and to prevent multiple copies (of different versions) from being installed, it is recommended to install rxjs first before redux-logic. That way you can use the same copy of rxjs elsewhere.

If you are never using rxjs outside of redux-logic and don't plan to use Observables directly in your logic then you can skip the rxjs install and it will be installed as a redux-logic dependency. However if you think you might use Observables directly in the future (possibly creating Observables in your logic), it is still recommended to install rxjs separately first
just to help ensure that only one copy will be in the project.

The rxjs install below `npm install rxjs@^5` installs the lastest 5.x.x version of rxjs.

```bash
npm install rxjs@^5 --save  # optional see note above
npm install redux-logic --save
```

## Main usage

```js
import { createLogic, createLogicMiddleware } from 'redux-logic';

/* returns a logic object that resembles the same structure of the
   input except that some defaults are applied and values were
   validated. You can directly access your hook functions from the
   object to perform isolated testing. Use the validate, transform,
   and process properties of the returned logic object */
const fooLogic = createLogic({
  // optional name - used in monitor$ and error messages, the default name assigned is L(TYPE)-N where TYPE is the action type(s) and N is the index in the logic array

  // filtering/canceling
  type: T, // required string, regex, array of str/regex, use '*' for all
  cancelType: CT, // string, regex, array of strings or regexes
  // type and cancelType also support redux-actions fns for which
  //   the fn.toString() returns the associated action type

  // limiting - optionally define any of these
  debounce: 0, // debounce for N ms, default 0
  throttle: 0, // throttle for N ms, default 0
  latest: true, // only take latest, default false

  // In non-production mode only, write to console.error if logic does
  // not complete by this time in milliseconds.
  // Set to `0` for non-ending logic.
  warnTimeout: 60000, // default: 60000 (one minute)

  // Put your business logic into one or more of these
  // execution phase hooks: validate, transform, process
  //
  // Note: If you provided any optional dependencies in your
  // createLogicMiddleware call, then these will be provided to
  // your code in the first argument along with getState and action
  // See advanced section for more details
  validate({ getState, action }, allow, reject) {
    // run your verification logic and then call allow or reject
    // with the action to pass along. You may pass the original action
    // or a modified/different action. Use undefined to prevent any
    // action from being propagated like allow() or reject()
    // If reject is used then the process hook will not be executed
    allow(action); // OR reject(action)
  }),

  // Note: transform is just an alias for the validate hook (next = allow)
  // to communicate clearer intent, you can do the same things in either
  transform({ getState, action }, next /*, reject */) {
    // perform any transformation and provide the new action to next
    next(action);
  }),


  // options influencing the process hook, defaults to {}
  processOptions: {
    // dispatch return value, or if returns promise/observable, dispatch resolved/next values
    // default false unless dispatch cb is omitted from process signature
    dispatchReturn: false,
    // enable multi-dispatch mode until done cb called or cancelled
    // default is false unless done is included in process signature
    dispatchMultiple: false,
    // string or action creator fn wrapping dispatched value
    successType: undefined, // default undefined
    // string or action creator fn wrapping dispatched, rejected, or thrown errors
    failType: undefined // default undefined
  },

  // If validate/transform reject was used then this hook will not be
  // executed. Including dispatch and/or done callbacks will influence
  // the default dispatching mode:
  // 1. Neither dispatch, nor done - dispatches the returned/resolved val
  // 2. Only dispatch - single dispatch mode, call dispatch exactly once (deprecated)
  // 3. Both dispatch and done - multi-dispatch mode, call done when finished
  // More details on dispatching modes are in the advanced API docs
  process({ getState, action, cancelled$ }, ?dispatch, ?done) {
    // Perform your processing then call dispatch with an action
    // Empty or undefined dispatch can be used if nothing to dispatch
    // See advanced API for discussion of dispatching modes
    dispatch(myNewAction); // in single dispatch mode this also completes
    done(); // only when performing multiple dispatches (done in signature)
  })
});

const logicMiddleware = createLogicMiddleware(
  arrLogic, // array of logic items, no duplicate refs to same logic
  deps   // optional injected deps/config, supplied to logic
);

// dynamically add injected deps at runtime after createStore has been
// called. These are made available to the logic hooks. The properties
// of the object `additionalDeps` will be added to the existing deps.
// For safety, this method does not allow existing deps to be overridden
// with a new value. It will throw an error if you try to override
// with a new value (setting to the same value/instance is fine).
logicMiddleware.addDeps(additionalDeps);

// dynamically add logic later at runtime, keeping logic state
// new logic should be unique and not refs to previous logic
// it will be added to the end of the existing chain
logicMiddleware.addLogic(arrNewLogic);

// dynamically add new logic later at runtime, keeping logic state
// only adds logic that it doesn't already have, so it is safe to
// use with split route bundles loading logic on the fly.
// New logic is added to the end of the existing chain.
logicMiddleware.mergeNewLogic(arrMergeLogic);

// replacing logic, logic state is reset but in-flight logic
// should still complete properly
// If arrReplacementLogic should be unique
logicMiddleware.replaceLogic(arrReplacementLogic);

// for server-side use, runs optional fn and returns promise
// when all in-flight processing/loading has completed.
// Use it after performing any required store.dispatch
store.dispatch(ROUTE_CHANGE); // triggers async loading in our logic
store.dispatch(FOO); // any number of additional dispatches
return logicMiddleware.whenComplete(() => { // returns promise
  return store.getState(); // can serialize store, loading was done
});

// observable for monitoring the internal operations, see advanced
logicMiddleware.monitor$

// A logicMiddleware instance can only be used with one store, it
// will throw an error if you try to reassociate it with another store.
// Simply create a new instance for each store that you are using.
```

## Execution phase hooks - validate, transform, process

The execution phase hooks are the places where you can hook your business logic code to be run during execution.

The validate and transform hooks are just aliases for the same hook internally named validtrans. The two names are just to help convey intent, you can do the same things in either including validation and transformation.

`validate/transform` happen before the other middleware and reducers have had a chance to see the action so you may check the state of your app and decide to allow the action as is, modify or augment it, change it to a different action, or choose to pass nothing along. You call `allow`, `reject`, or `next` once with the action to pass along or empty to pass nothing (like `allow()`). If you call `reject` then the process execution hook will not be executed.

The `process` hook only runs if `allow` or `next` was called. It happens after the action from `allow/next` was passed onto the other logic, middleware, and reducers. Assuming there was no delays or asynchronicity created from other logic or middleware then the `getState()` will return the state after the actions have been processed by the reducers.

You may implement one or more hooks depending on your business logic. The lifecycle is as follows:

 1. validate(depObj, allow, reject) OR transform(depObj, next /*, reject */)
 2. Action from allow/reject/next is passed along to other logic, middleware, and reducers

 3. process(depObj, dispatch?, done?) // only called if allow/next was called

Each `depObj` contains `getState`, `action`, along with any user injected deps and a few other advanced properties. See [advanced section](#additional-properties-available-to-execution-hooks) for full details.

### validate hook

This hook is run first and it allows your business logic to access the full state (prior to reducers updating state for this action), `getState()` and the `action`.

You may perform sync or async business logic and when ready call `allow` or `reject`. `allow(action)` or `reject(action)`. `allow` or `reject` must be called exactly once when you are done validating or verifying.

Calling `allow` or `reject` influences whether the process hook will be run. If `reject` was called then `process` hook will not be run.

Note that you pass an action to `allow` and `reject` as the first argument. You may also call it with `undefined` if you do not wish to have anything propagate further. `allow()` or `reject()`. Process hook would still be executed for `allow()` but not `reject()`.

You can augment, modify, change actions however you want in your `allow` or `reject` call.

By default, `allow` and `reject` will pass whatever action they are given to the next middleware or reducer unless the type has changed from the original action type. If it has changed then the action will instead be dispatched so that all middleware will have an opportunity to see it prior to it hitting reducers. This should be fine for most types of uses, however if you need to override this automatic mechanism, see the advanced section.

The default validation hook if not provided is:

```js
validate({ getState, action }, allow, reject) {
  allow(action); // allow all
}
```

### transform hook (alias for validate hook)

The `transform` hook is just another alias for the validate hook which helps you convey the intent of your business logic. Since it is the same step it can do the same things validating, transforming, etc. `allow` is named `next` since that is what makes more sense in a transformation type logic. Normally you wouldn't need the `reject` but it is also available.

You might use transformations to modify or augument actions (like adding a unique ID, timestamp, looking up data and including, etc).

Just like with the `validate` hook you are expected to call the `next` function (or `reject` function) one time passing it the modified action or empty `next()` to pass nothing. Calling `next` will enable the `process` hook to eventually run, but calling `reject` would prevent `process` hook from running the same as explained in the validate hook. See the `validate` hook for the details about how it decides whether to pass along the action or to dispatch it. The advanced section discusses how that can be overridden.

The default `transform` hook is (same as default validation hook):

```js
transform({ getState, action }, next /*, reject */) {
  next(action); // passes original
}
```

### process hook

The `process` hook is run asynchronously after the middlware calls `next`, so typically this means that the state will have been updated by the reducers (unless there are any other async middleware or logic delaying execution). Thus the process hook's getState will refer to recently updated state.

The `process` hook is only executed if the `validate/transform` hook allow was called. If `reject` was called then the `process` hook will not be executed.

The `process` hook is an ideal place to make async requests and then dispatch the results or an error.

The `dispatch` function returns the value passed into it to make it easy to use in promise chaining.

If you set the `processOptions` object, you can further influence how process behaves streamlining your code.

  - `processOptions.dispatchReturn` - if true, then process will use the returned value to dispatch. If you return a promise then it will use the resolve/reject values for dispatching. If you return an observable then it will use its values or error for dispatching. Returning an undefined, promise that resolves to undefined, or observable value of undefined will cause no dispatch. Default varies based on whether the process fn signature includes dispatch or not. If dispatch is included then dispatchReturn defaults to false and vice versa.
  - `processOptions.dispatchMultiple` - if true, then dispatch function will not end the underlying observable until the `done` callback is called or it is cancelled. The default value for dispatchMultiple is determined by the process fn signature, if it includes the `done` callback then the default is true otherwise it is false. Note: in a future version, this option will be always on. If your logic does not end, set the top level option `warnTimeout: 0`.
  - `processOptions.successType` - if set to an action type string or an action creator function it will use this to create the action from the dispatched value. If the `successType` was a string then it will create an action of this type and set the payload to the dispatched value (following [FSA format](https://github.com/acdlite/flux-standard-action "Flux Standard Actions format")). If it was an action creator function then it will pass the value to the action creator and then dispatch that. Default undefined.
  - `processOptions.failType` - if set to an action type string or an action creator function it will use this to create the action from the dispatched error or rejected promise value or errored observable similar to how `successType` works. If `failType` was a string then it uses the [FSA error format](https://github.com/acdlite/flux-standard-action "Flux Standard Actions format") otherwise it calls the action creator provided. If `failType` is not defined and an error is thrown or dispatched that does not itself have a `type` (action type), then an `UNHANDLED_LOGIC_ERROR` will be dispatched with the error as the payload. Default `undefined`.

The process hook's full signature is `process(deps, dispatch?, done?)`.

If the done callback is provided in your code then it is assumed that you want to do multiple dispatching and thus you need to call done when you are finished.

You can omit the done and the process hook switches into single dispatch mode (this is deprecated), expecting that dispatch would be called exactly once. If you determine you don't need to dispatch anything then you can make an empty `dispatch()`. This mode is deprecated and will be removed in a future version.

If you prefer to use promises, async/await, or observables then redux-logic makes it easy to use those as well ([see discussion later](/jeffbski/redux-logic/blob/master/docs/api.md#dispatch---multi-dispatching-and-process-variable-signature)).


The default `process` hook if none is provided is:

```js
process({ getState, action }, dispatch, done) {
  dispatch(); // dispatch nothing and complete
  done(); // done dispatching
}
```

An example of using `processOptions`:

```js
import { createLogic } from 'redux-logic';

const logic = createLogic({
  type: FOO,
  processOptions: {
    // if your process fn below omits the dispatch cb then
    // dispatchReturn will default to true, so you could skip
    // this line, but it is left for clarity
    dispatchReturn: true,       // use my return for dispatch
    successType: 'FOO_SUCCESS', // my action type for success
    failType: 'FOO_ERROR',      // my action type for failure
  },
  process({ getState, action }) {
    // since we didn't include dispatch cb in our signature
    // dispatchReturn will default to true,  actions are created
    // from the returned obj, resolved/rejected promise or obs
    return axios.get('https://server/api/users')
      .then(resp => resp.data.users); // select the data
  }
}
```


## Advanced Usage

### dispatch and return (when dispatchReturn:true) handling of process hook

When you call your process hook `dispatch` function with a value or when you return a value from the process hook (when `dispatchReturn:true` or omitting dispatch/done in process hook):

 - `undefined` - nothing will be dispatched
 - `Error` - check failType OR if has `type`, dispatch it, otherwise wrap with UNHANDLED_LOGIC_ERROR action with the error as the `payload`.
 - `Promise` - once promise resolves or rejects, apply the rules:
   - resolving - check successType OR if truthy dispatch
   - rejecting - check failType OR handle as Error
 - `Observable` - as observable emits next or error, apply the rules:
   - next - check successType OR if truthy dispatch
   - error - check failType OR handle as Error
 - `null` - check successType OR dispatch nothing
 - `Object`, `Function`, or anything else truthy - check successType OR dispatch

The processOptions section next explain how successType and/or failType options can wrap your values into an action object.

### processOptions - influencing process hook

Simplifying code by declaring additional properties in processOptions.

 - `dispatchReturn` - the returned value of the process function will be dispatched or if it is a promise or observable then the resolve, reject, or observable values will be dispatched applying any successType or failType logic if defined. Default is determined by arity of process fn, `true` if dispatch not provided, `false` otherwise. Most users will simply omit or include dispatch/done in the process hook to enable or disable this property. [Details](https://github.com/jeffbski/redux-logic/blob/master/docs/api.md#dispatch---multi-dispatching-and-process-variable-signature)

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
     - if the action creator fn returns a falsey value like `undefined` then nothing will be dispatched. This allows your action creator to control whether something is actually dispatched based on teh value provided to it.

The successType and failType would enable clean code, where you can simply return a promise or observable that resolves to the payload and rejects on error. The resulting code doesn't have to deal with dispatch and actions directly.

 - `dispatchMultiple` - Normally this is set automatically based on the arity of the function provided as the process hook. This governs whether process expects a single or multiple dispatches. [Details](https://github.com/jeffbski/redux-logic/blob/master/docs/api.md#dispatch---multi-dispatching-and-process-variable-signature). It is likely that a future version of redux-logic will drop the single dispatch mode to prevent confusion and misuse after which case this property will no longer be needed.

### Additional properties available to execution hooks

The first argument of each execution phase hook, `depObj`, contains any dependencies that were supplied to the createLogicMiddleware command as well as built-in properties.

The signature of each execution phase hook is:

```js
validate(depObj, allow, reject)
transform(depObj, next, ?reject)
process(depObj, ?dispatch, ?done)
```

Supplying dependencies to createLogicMiddleware makes it easy to create testable code since you can use different injected deps in your tests than you do at runtime. It also makes it easy to inject different config or connections in development, staging, and production. Use of these is optional.

There are also built-in properties supplied to the execution hooks regardless of whether you supply any dendencies or not. These are merged in at runtime.

 - `getState` - the `store.getState` function is provided so logic can get access to the full state of the app. In the `validate` and `transform` hooks this will be the state before the reducers have updated anything for this action. For the `process` hook, the reducers should have been run (unless there are other middleware introducing async delays).
 - `action` - in `validate/transform` hook this is the action that triggered the logic to run. In the `process` hook it will be the action passed on by the `transform` hook, or if it was falsey then the original action will be provided.
 - `ctx` - initially an empty object representing a shared place that you can use to pass data between the `validate/transform` and `process` hooks if you have implemented more than one of them. For instance if you set the `ctx.foo = { a: 1}` in your `validate` hook, then the `process` hook can read the previous value.
 - `cancelled$` - an observable that emits if the logic is cancelled. This osbservable will also complete when the hooks have finished, regardless of whether it was cancelled. Subscribing to the cancelled$.next allows you to respond to a cancellation performing any additional cleanup that you need to do. For instance if you had a long running web socket connection, you might close it. Normally you won't need to use this unless there is something you need to close from your end. Even without using `cancelled$` future dispatching is stopped, so use of this is only necessary for cleanup or termination of resources you created.

### Cancellation / take latest - XHR aborting

Many libraries like fetch don't support aborting/cancelling of an in-flight request, so the best that we can do is to simply not dispatch the results for cancelled or outdated requests. Unfortunately some browsers could delay your new requests while the previous ones are still outstanding (they have limits for concurrent requests).

However if you use a HTTP library that returns an observable like RxJS DOM ajax, then you can dispatch the observable to redux-logic and XHR abort will be performed on in-flight requests if they are cancelled or in a take latest situation. Observables support cancellation and thus when redux-logic cancels the subscription it bubbles back to the source and causes an xhr abort like you would want. Thus if you need true xhr aborts, use RxJS DOM's ajax or similar API that returns an observable and dispatch that to redux-logic.

```js
import { createLogic } from 'redux-logic';
import Rx from 'rxjs'; // or selectively import only what you need
const ajax = Rx.Observable.ajax;

const usersFetchLogic = createLogic({
  type: USERS_FETCH,
  cancelType: USERS_FETCH_CANCEL,
  latest: true, // take latest only

  // By not including done in the hook, process is in single dispatch
  // mode so it expects dispatch to be called exactly once
  process({ getState, action }, dispatch) {
    // dispatch the values from this observable
    // cancel and take latest will abort in-flight xhr requests
    dispatch(
      // the delay query param adds arbitrary delay to the response
      ajax.getJSON(`http://reqres.in/api/users?delay=${delay}`)
        .map(data => data.data) // use data property of payload
        .map(users => ({
          type: USERS_FETCH_FULFILLED,
          payload: users
        }))
        .catch(err => Observable.of({
          type: USERS_FETCH_REJECTED,
          payload: err,
          error: true
        }))
    );
  }
});
```

or using processOptions

```js
import { createLogic } from 'redux-logic';
import Rx from 'rxjs'; // or selectively import only what you need
const ajax = Rx.Observable.ajax;

const usersFetchLogic = createLogic({
  type: USERS_FETCH,
  cancelType: USERS_FETCH_CANCEL,
  latest: true, // take latest only

  processOptions: {
    dispatchReturn: true,  // dispatch the values from returned obs
    successType: USERS_FETCH_FULFILLED, // apply this action type
    failType: USERS_FETCH_REJECTED // apply this action type on err
  },

  process({ getState, action }) {
    // dispatch the values from this returned observable
    // cancel and take latest will abort in-flight xhr requests
    // the delay query param adds arbitrary delay to the response
    return ajax.getJSON(`http://reqres.in/api/users?delay=${delay}`)
      .map(payload => payload.data); // use data property of payload
  }
});
```


### allow, reject, next - optional second argument options

`allow`, `reject`, and `next` all support an optional second argument `options` which can change its operation.

By default the second argument, `options`, defaults to: `{ useDispatch: 'auto' }`.

For most use cases this is the appropriate setting, it basically checks to see if the action type of the new action provided to `allow`, `reject`, or `next` has the same action type of the original action. If it matches the original then the `allow`, `reject`, or `next` call will pass the action down to the next logic or middleware.

If the action type was different then it will instead perform a dispatch. Most likely if the action type was changed then it really needs to go back to dispatch starting at the top so all middleware and any other logic have an opportunity to see it before going down the chain to the reducers. If the action type was the same then most likely we want to just let it continue down the stack (otherwise if we force it to dispatch, we better be careful not to create a loop).

If you want to force a dispatch, you may provide as your options `{ useDispatch: true }`, for example: `allow(action, { useDispatch: true })` or similarly for reject or next.

Alternatively if you just want to force the action being passed down (not dispatched regardless of type) use `{ useDispatch: false }`, just note that in doing so previous logic and middleware won't have another opportunity to see this action.

In most situations the default options `{ useDefault: 'auto' }` is the proper choice.

### dispatch - multi-dispatching and process' variable signature

The `process` hook supports a variable signature that affect how dispatching works

The official signature for process is
```js
process({ getState, action }, ?dispatch, ?done)
```

which results in the following three possible variations:

```js
// dispatch from returned object, resolved promise, or observable
// this defaults processOptions.dispatchReturn = true enabling
// dispatching of the returned/resolved values
// If you decide that you do not need to dispatch anything you may
// returning an undefined or promise resolving to undefined
process({ getState, action }) {
  return objOrPromiseOrObservable;
}
```

```js
// single dispatch (deprecated) - call dispatch exactly once
// call with undefined if you do not need to dispatch anything
process({ getState, action }, dispatch) {
  dispatch(objOrPromiseOrObservable); // call exactly once
}
```

```js
// multiple dispatch, call done when finished dispatching
// this defaults processOptions.dispatchMultiple = true
// which enables the multiple dispatch mode
process({ getState, action }, dispatch, done) {
  dispatch(objOrPromiseOrObservable);
  dispatch(objOrPromiseOrObservable);
  done(); // call when done dispatching
}
```

This should be somewhat intuitive so that you include the parameters when you need to use them. In the first case, you are returning an object, promise, or observable so the values returned or resolved will be dispatched.

In the second case you only have dispatch so like with the other hooks (validate/transform) you would be expected to call it exactly once. Due to confusion and misuse, single-dispatch is deprecated and will be removed in a future version.

And finally in the third case since done is included, it triggers multi-dispatch mode so you can freely dispatch as many items as necessary, just calling done when finished. You can also switch this mode on using processOptions.dispatchMultiple=true regardless of whether you include the `done` cb. In some situations like with a subscription, you might never need to end until cancelled, so you can just set the processOptions.dispatchMultiple to true and ignore the done since it isn't needed.

Note that in any case if you do not wish to dispatch something you can make an empty call like `dispatch()` and the call will be ignored.

Also note that in any case you can dispatch an observable which allows you to effectively dispatch any number of items. It will continue to keep dispatching alive until the observable completes.

Note: the previous v0.9 mechanism for multiple dispatches setting the second parameter of the dispatch function to `{allowMore: true}` will also work but is deprecated in lieu of this simpler arity approach.


An example of performing multiple dispatches without using an observable:

```js
// including the done cb, triggers multi-dispatch mode
process({ getState, action }, dispatch, done) {
  dispatch({ type: BAR });
  dispatch({ type: CAT });
  dispatch({ type: DOG });
  done(); // indicate when done dispatching
}
```

For a subscription that never ends (except when cancelled) the relevant parts of our createLogic might look something like this

```js
cancelType: CANCEL_SUBSCRIPTION, // whatever action(s) cancel
latest: true, // use only latest

processOptions: {
  dispatchMultiple: true // turn on multiple dispatch mode
},

// we didn't include done since we never use it, dispatchMultiple
// has already turned on multi-dispatch mode for us
process({ getState, action }, dispatch) {
  apiSubscription()
    .on('updated', result => dispatch(result));
}
```

Alternatively you could dispatch an observable and perform any number of dispatches inside it.

```js
process({ getState, action }, dispatch, done) {
  const ob$ = Observable.of(  // from rxjs
    { type: 'BAR' }, // first dispatch
    { type: 'CAT' }, // second dispatch
    { type: 'DOG' }  // third dispatch
  );
  dispatch(ob$);
  done(); // tell logic to complete when the ob$ completes
}
```

Or if dispatching things over time

```js
process({ getState, action }, dispatch, done) {
  const ob$ = Observable.create(obs => {
    // in parallel fire multiple requests and dispatch the results
    // by calling obs.next on the action to dispatch
    // when they arrive, then complete when done
    Promise.all([
      axios.get('http://server/users')
        .then(users => obs.next({ type: USERS, payload: users })),
      axios.get('http://server/categories')
        .then(categories => obs.next({ type: CAT, payload: categories }))
     ]).then(values => obs.complete()); // values dispatched
  });
  dispatch(ob$);
  done(); // tell logic to complete when the ob$ completes
}
```

### Monitoring redux logic internal operations

For debugging or gaining insight into the internal operations of redux-logic, you may subscribe to the monitor$ observable. This could also be used for developing developer tools.

```js
logicMiddleware.monitor$.subscribe(
  x => console.log(x)
);
```

The structure emitted by the observable is an object with properties:

 - action - the original action
 - op - what is occurring in redux-logic, one of the following values
   - top - top of the redux-logic before any logic
   - bottom - after all redux-logic processing handed to next middleware/reducers
   - begin - enter a logic
   - next - validate or transform intercept has passed to the next logic/middleware
   - nextDisp - validate or transform intercept was successful but needs to be dispatched
   - nextError - error thrown while the middleware next (or dispatch) call was executing, possibly from downstream middleware, reducer, or render
   - filtered - validate or transform passed undefined so action is filtered and not passed to other logic/middleware/reducers
   - cancelled - intercept was cancelled either from cancelType or take latest
   - dispatch - dispAction was dispatched to store
   - dispCancelled - dispatch was cancelled either from cancelType or take latest
   - end - everything has completed for this logic including async processing
 - name - name of the logic operating on this action
 - nextAction - action being passed down to next logic/middleware/reducer
 - shouldProcess - true/false on op:next indicating whether validation was successful and process should be invoked
 - dispAction - action to dispatch to store


For example:

```js
{ action: { type: 'FOO' }, op: 'top' }
{ action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' }
{ action: { type: 'FOO' }
  nextAction: { type: 'FOO', payload: 42 }
  name: 'L(FOO)-0',
  shouldProcess: true,
  op: 'next' }
{ nextAction: { type: 'FOO', payload: 42 }, op: 'bottom' }
{ action: { type: 'FOO' },
  dispAction: { type: 'BAR', payload: 42 },
  op: 'dispatch' },
{ action: { type: 'FOO' },
  name: 'L(FOO)-0',
  op: 'end' }
```

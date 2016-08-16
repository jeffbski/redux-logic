# redux-logic API

Contents:

 - [Main usage](#main-usage)
 - [Execution phase hooks](#execution-phase-hooks---validate-transform-process) - [validate](#validate-hook), [transform](#transform-hook), [process](#process-hook)
 - [Advanced usage](#advanced-usage)

## Main usage

```js
/* returns a logic object that resembles the same structure of the
   input except that some defaults are applied and values were
   validated. You can directly access your hook functions from the
   object to perform isolated testing. Use the validate, transform,
   and process properties of the returned logic object */
const fooLogic = createLogic({
  // filtering/canceling
  type: T, // required string, regex, array of str/regex, use '*' for all
  cancelType: CT, // string, regex, array of strings or regexes
  // type and cancelType also support redux-actions fns for which
  //   the fn.toString() returns the associated action type

  // limiting - optionally define one of these
  latest: true, // only take latest, default false
  debounce: 0, // debounce for N ms, default 0
  throttle: 0, // throttle for N ms, default 0

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
    dispatchReturn: false, // default false
    // string or action creator fn wrapping dispatched value
    successType: undefined, // default undefined
    // string or action creator fn wrapping dispatched, rejected, or thrown errors
    failType: undefined // default undefined
  },

  // If validate/transform reject was used then this hook will not be
  // executed. Call dispatch exactly once or read the advanced api about
  // performing multiple dispatches
  process({ getState, action, cancelled$ }, dispatch) {
    // Perform your processing then call dispatch with an action
    // or use dispatch() to complete without dispatching anything.
    // Multi-dispatch: see advanced API docs
    dispatch(myNewAction);
  })
});

const logicMiddleware = createLogicMiddleware(
  arrLogic, // array of logic items
  deps   // optional injected deps/config, supplied to logic
);

// dynamically add logic later at runtime, keeping logic state
logicMiddleware.addLogic(arrNewLogic);

// replacing logic, logic state is reset but in-flight logic
// should still complete properly
logicMiddleware.replaceLogic(arrReplacementLogic);
```

## Execution phase hooks - validate, transform, process

The execution phase hooks are the places where you can hook your business logic code to be run during execution.

The validate and transform hooks are just aliases for the same hook internally named validtrans. The two names are just to help convey intent, you can do the same things in either including validation and transformation.

`validate/transform` happen before the other middleware and reducers have had a chance to see the action so you may check the state of your app and decide to allow the action as is, modify or augment it, change it to a different action, or choose to pass nothing along. You call `allow`, `reject`, or `next` once with the action to pass along or empty to pass nothing (like `allow()`). If you call `reject` then the process execution hook will not be executed.

The `process` hook only runs if `allow` or `next` was called. It happens after the action from `allow/next` was passed onto the other logic, middleware, and reducers. Assuming there was no delays or asynchronicity created from other logic or middleware then the `getState()` will return the state after the actions have been processed by the reducers.

You may implement one or more hooks depending on your business logic. The lifecycle is as follows:

 1. validate(depObj, allow, reject) OR transform(depObj, next /*, reject */)
 2. Action from allow/reject/next is passed along to other logic, middleware, and reducers

 3. process(depObj, dispatch) // only called if allow/next was called

Each `depObj` contains `getState`, `action`, along with any user injected deps and a few other advanced properties. See [advanced section](#additional-properties-available-to-execution-hooks) for full details.

### validate hook

This hook is run first and it allows your business logic to access the full state (prior to reducers updating state for this action), `getState()` and the `action`.

You may perform sync or async business logic and when ready call `allow` or `reject`. `allow(action)` or `reject(action)`. `allow` or `reject` must be called exactly once when you are done validating or verifying.

Calling `allow` or `reject` influences whether the process hook will be run. If `reject` was called then `process` hook will not be run.

Note that you pass an action to `allow` and `reject` as the first argument. You may also call it with `undefined` if you do not wish to have anything propogate further. `action()` or `reject()`. Process hook would still be executed for `action()` but not `reject()`.

You can augment, modify, change actions however you want in your `allow` or `reject` call.

By default, `allow` and `reject` will pass whatever action they are given to the next middleware or reducer unless the type has changed from the original action type. If it has changed then the action will instead by dispatched so that all middleware will have an opportunity to see it prior to it hitting reducers. This should be fine for most types of uses, however if you need to override this automatic mechanism, see the advanced section.

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

If you set the `processOptions` object, you can further influence how process behaves streamlining your code.

  - `processOptions.dispatchReturn` - if true, then process will use the returned value to dispatch. If you return a promise then it will use the resolve/reject values for dispatching. If you return an observable then it will use its values or error for dispatching. Returning an undefined, promise that resolves to undefined, or observable value of undefined will cause no dispatch. Default is false.
  - `processOptions.successType` - if set to an action type string or an action creator function it will use this to create the action from the dispatched value. If the `successType` was a string then it will create an action of this type and set the payload to the dispatched value. If it was an action creator function then it will pass the value to the action creator and then dispatch that. Default undefined.
  - `processOptions.failType` - if set to an action type string or an action creator function it will use this to create the action from the dispatched error or rejected promise value or errored observable similar to how `successType` works. If `failType` is not defined and an error is thrown or dispatched that does not itself have a `type` (action type), then an UNHANDLED_LOGIC_ERROR will be dispatched with the error as the payload. Default undefined.

Since the most common use case is to do a single dispatch, that's what `process` expects by default. You would call `dispatch` exactly one time passing whatever success or failure action. If you decide in your logic that you don't want to dispatch anything call `dispatch` empty `dispatch()` to complete the logic.

If you want to perform multiple dispatches for a long running subscription or to dispatch many different things then there are a couple ways to do it. You may dispatch an observable and for every result it will dispatch. There is also a way to perform multiple dispatches by using dispatch's options 2nd argument. See advanced section for more details.

The default `process` hook if none is provided is:

```js
process({ getState, action }, dispatch) {
  dispatch(); // dispatch nothing and complete
}
```

An example of using `processOptions`:

```js
const logic = createLogic({
  type: FOO,
  processOptions: {
    dispatchReturn: true,       // use my return for dispatch
    successType: 'FOO_SUCCESS', // my action type for success
    failType: 'FOO_ERROR',      // my action type for failure
  },
  process({ getState, action }) {
    // no need to dispatch when using dispatchReturn: true
    // actions are created from the resolved or rejected promise
    return axios.get('https://server/api/users')
      .then(resp => resp.data.users); // select the data
  }
}


## Advanced Usage

### Additional properties available to execution hooks

The first argument of each execution phase hook, `depObj`, contains any dependencies that were supplied to the createLogicMiddleware command as well as built-in properties.

The signature of each execution phase hook is:

```js
validate(depObj, allow, reject)
transform(depObj, next, /*, reject */)
process(depObj, dispatch)
```

Supplying dependencies to createLogicMiddleware makes it easy to create testable code since you can use different injected deps in your tests than you do at runtime. It also makes it easy to inject different config or connections in development, staging, and production. Use of these is optional.

There are also built-in properties supplied to the execution hooks regardless of whether you supply any dendencies or not. These are merged in at runtime.

 - `getState` - the `store.getState` function is provided so logic can get access to the full state of the app. In the `validate` and `transform` hooks this will be the state before the reducers have updated anything for this action. For the `process` hook, the reducers should have been run (unless there are other middleware introducing async delays).
 - `action` - in `validate/transform` hook this is the action that triggered the logic to run. In the `process` hook it will be the action passed on by the `transform` hook, or if it was falsey then the original action will be provided.
 - `ctx` - initially an empty object representing a shared place that you can use to pass data between the `validate/transform` and `process` hooks if you have implemented more than one of them. For instance if you set the `ctx.foo = { a: 1}` in your `validate` hook, then the `process` hook can read the previous value and potentially update.
 - `cancelled$` - an observable that emits if the logic is cancelled. This osbservable will also complete when the hooks have finished, regardless of whether it was cancelled. Subscribing to the cancelled$.next allows you to respond to a cancellation performing any additional cleanup that you need to do. For instance if you had a long running web socket connection, you might close it. Normally you won't need to use this unless there is something you need to close from your end. Even without using `cancelled$` future dispatching is stopped, so use of this is only necessary for cleanup or termination of resources you created.

### allow, reject, next - optional second argument options

`allow`, `reject`, and `next` all support an optional second argument `options` which can change its operation.

By default the second argument, `options`, defaults to: `{ useDispatch: 'auto' }`.

For most use cases this is the appropriate setting, it basically checks to see if the action type of the new action provided to `allow`, `reject`, or `next` has the same action type of the original action. If it matches the original then the `allow`, `reject`, or `next` call will pass the action down to the next logic or middleware.

If the action type was different then it will instead perform a dispatch. Most likely if the action type was changed then it really needs to go back to dispatch starting at the top so all middleware and any other logic have an opportunity to see it before going down the chain to the reducers. If the action type was the same then most likely we want to just let it continue down the stack (otherwise if we force it to dispatch, we better be careful not to create a loop).

If you want to force a dispatch, you may provide as your options `{ useDispatch: true }`, for example: `allow(action, { useDispatch: true })` or similarly for reject or next.

Alternatively if you just want to force the action being passed down (not dispatched regardless of type) use `{ useDispatch: false }`, just note that in doing so previous logic and middleware won't have another opportunity to see this action.

In most situations the default options `{ useDefault: 'auto' }` is the proper choice.

### dispatch - optional second argument options - multi-dispatching

The `process`'s `dispatch` function accepts a second `options` argument which changes its behavior slightly. It defaults to `{ allowMore: false }`.

The `allowMore` option controls whether `dispatch` will complete our underlying wrapping observable after being called. By default, allowMore is set to false so that means that `process` is only expecting to be called exactly one time, typically with its results on success or the failure if it errored. Thus it will complete the underlying wrapping observable after dispatch is called. If the logic decided it didn't want to dispatch anything it should be called empty like `dispatch()`.

If you dispatch an observable instead of an action, then the underlying wrapping observable will stay alive until the dispatched observable completes. So dispatching an observable allows long running subscription type dispatching regardles of using allowMore. Process will dispatch each value that comes from the observable continuing until it completes.

If you don't want to deal with creating observables of your own, the allowMore option allows you to perform multiple dispatch as well. Set `{ allowMore: true }` to keep open the dispatching until you are ready to complete, then call `dispatch` one final time with `{allowMore: false}` or just using the default options `dispatch(action)` or `dispatch()`.

An example of performing multiple dispatches without using an observable:

```js
process({ getState, action }, dispatch) {
  dispatch({ type: BAR }, { allowMore: true }); // keep dispatch open
  dispatch({ type: CAT }, { allowMore: true }); // keep dispatch open
  dispatch({ type: DOG }); // dispatch and complete
}
```

Alternatively you could dispatch an observable and perform any number of dispatches inside it.

```js
process({ getState, action }, dispatch) {
  const ob$ = Observable.of(  // from rxjs
    { type: 'BAR' },
    { type: 'CAT' },
    { type: 'DOG' }
  );
  dispatch(ob$);
}
```

Or if dispatching things over time

```js
process({ getState, action }, dispatch) {
  const ob$ = Observable.create(obs => {
    // in parallel fire multiple requests and dispatch the results
    // when they arrive, then complete when done
    Promise.all([
      axios.get('http://server/users')
        .then(users => obs.next({ type: USERS, payload: users })),
      axios.get('http://server/categories')
        .then(categories => obs.next({ type: CAT, payload: categories }))
     ]).then(values => obs.complete()); // values already dispatched
  });
  dispatch(ob$);
}
```

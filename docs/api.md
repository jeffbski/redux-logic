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
  type, // required string, regex, array of str/regex, use '*' for all
  cancelType, // string, regex, array of strings or regexes

  // limiting - optionally define one of these
  latest, // only take latest, default false
  debounce, // debounce for N ms, default 0
  throttle, // throttle for N ms, default 0

  // Put your business logic into one or more of these
  // execution phase hooks.
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
    allow(action); // OR reject(action)
  }),

  transform({ getState, action }, next) {
    // perform any transformation and provide the new action to next
    next(action);
  }),

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

The execution phase hooks are the places where you can hook your business logic code to be run during execution. You may implement one or more hooks depending on your business logic. The phases are executed in the order below.

 1. validate(depObj, allow, reject)
 2. transform(depObj, next)
 3. process(depObj, dispatch)

`depObj` contains `getState`, `action`, along with any user injected deps and a few other advanced properties. See [advanced section](#additional-properties-available-to-execution-hooks) for full details.

### validate hook

This hook is run first and it allows your business logic to access the full state (prior to reducers updating state for this action), `getState()` and the `action`.

You may perform sync or async business logic and when ready call allow or reject. `allow(action)` or `reject(action)`. Allow or reject must be called exactly once when you are done validating or verifying.

Calling allow or reject influences whether the process hook will be run. If reject was called then process hook will not be run.

Not that you pass an action to allow and reject as the first argument. You may also call it with undefined if you do not wish to have anything propogate further. `action()` or `reject()`. Process hook would still be executed for `action()` but not `reject()`.

You can augment, modify, change actions however you want in your allow or reject call.

By default, allow and reject will pass whatever action they are given to the next middleware or reducer unless the type has changed from the original action type. If it has changed then it will instead by dispatched so that all middleware will have an opportunity to see it prior to it hitting reducers. This should be fine for most types of uses, however if you need to override this automatic mechanism, see the advanced section.

The default validation hook if not provided is:

```js
validate({ getState, action }, allow, reject) {
  allow(action); // allow all
}
```

### transform hook

For business logic that need to be applied to all actions that match the type filter you can use the transform hook. Technically since the validation hook can provide modified actions to allow or reject, it can also do transformations there, but to make the intent clearer, this separate hook was introduced for logic that is not doing validation or verification.

For instance if you wanted to augment all actions (or actions matching certain types) you could implement the proper type filter along with a simple logic that does the augmenting calling next with the modified action.

The transform hook runs after the validate hook so it receives the action passed on by allow or reject. If allow or reject did not provide an action but used undefined then the transform will not be run.

Both allow or reject actions will flow through the transform hook unless they were dispatched instead. See advanced section for discussion on this.

You may do synchronous or asynchronous work in your transform, but you are expected to call the `next` function exactly one time `next(action)`. If you do not wish to propogate an action, you may call it with undefined `next()`.

The default transform hook is:

```js
transform({ getState, action }, next) {
  next(action); // no transformation
}
```

### process hook

The process hook is run asynchronously after the middlware calls next, so typically this means that the state will have been updated by the reducers (unless there are any other async middleware or logic delaying execution). Thus the process hook's getState will refer to recently updated state.

The process hook is only executed if the validation hook allow was called (or if the validation hook was not defined and thus the default validation was used). If reject was called then the process hook will not be executed.

The process hook is an ideal place to make async requests and then dispatch the results or an error.

By default it is expected that you would call the dispatch function one time to dispatch either results or an error. If you don't wish to dispatch anything then calling dispatch with undefined like `dispatch()` will dispatch nothing but will complete the logic.

You may also dispatch an observable if you want to make multiple dispatches or perform a long running subscription. See advanced section for more details.

The default process hook if none is provided is:

```js
process({ getState, action }, dispatch) {
  dispatch(); // dispatch nothing and complete
}
```

## Advanced Usage

### Additional properties available to execution hooks

The first argument of each execution phase hook, `depObj`, contains any dependencies that were supplied to the createLogicMiddleware command as well as built-in properties.

The signature of each execution phase hook is:

```js
validate(depObj, allow, reject)
transform(depObj, next)
process(depObj, dispatch)
```

Supplying dependencies to createLogicMiddleware makes it easy to create testable code since you can use different injected deps in your tests than you do at runtime. It also makes it easy to inject different config or connections in development, staging, and production. Use of these is optional.

There are also built-in properties supplied to the execution hooks regardless of whether you supply any dendencies or not. These are merged in at runtime.

 - `getState` - the `store.getState` function is provided so logic can get access to the full state of the app. In the validate and transform hooks this will be the state before the reducers have updated anything for this action. For the process hook, the reducers should have been run (unless there are other middleware introducing async delays).
 - `action` - in validate hook this is the action that triggered the logic to run. In transform it will be the action that validation had passed on via allow or reject. In the process hook it will be the action passed on by the transform hook, or if it was falsey then the original action will be provided.
 - `ctx` - initially an empty object representing a shared place that you can use to pass data between the validate, transform, and process hooks if you have implemented more than one of them. For instance if you set the `ctx.foo = { a: 1}` in your validate hook, then transform hook, and process hook can read the previous value and potentially update.
 - `cancelled$` - an observable that emits if the logic is cancelled. This osbservable will also complete when the hooks have finished, regardless of whether it was cancelled. Subscribing to the cancelled$.next allows you to respond to a cancellation performing any additional cleanup that you need to do. For instance if you had a long running web socket connection, you might close it. Normally you won't need to use this unless you are using a long running connection that you need to close from your end. Even without using `cancelled$` future dispatching is stopped, so use of this is only necessary for cleanup or termination of resources you created.

### allow, reject, next - optional second argument options

`validate`'s allow and reject as well as `transform`'s next support an optional second argument which can adjust its operation.

By default the second argument defaults to: `{ useDispatch: 'auto' }`.

For most use cases this is the appropriate setting, it basically checks to see if the action type of the new action provided to allow, reject, or next has the same action type of the original action. If it matches the original then the allow, reject, or next call will pass the action down to the next logic or middleware. If the action type was different then it will instead perform a dispatch. Most likely if the action type was changed then it really needs to go back to dispatch starting at the top so all middleware and any other logic have an opportunity to see it before going down the chain to the reducers. If the action type was the same then most likely we want to just let it continue down the stack (otherwise we'd have to be careful not to create a loop).

If you want to force a dispatch, you may provide as your options `{ useDispatch: true }`, so your all would look like `allow(action, { useDispatch: true })` or similarly for reject or next.

Alternatively if you want to force a next call instead `{ useDispatch: false }`, just note that in doing so previous logic and middleware won't have another opportunity to see this action.

In most situations the default options `{ useDefault: 'auto' }` is the proper choice.

### dispatch - optional second argument options - multi-dispatching

The `process`'s dispatch function accepts a second options argument which changes its behavior slightly. It defaults to `{ allowMore: false }`.

The `allowMore` option controls whether dispatch will complete or not after being called. By default, allowMore is set to false so that means that process is only expecting to be called exactly one time, typically with its results on success or the failure if it errored. Thus it will complete the underlying wrapping observable after dispatch is called. If the logic decided it didn't want to dispatch anything it should be called empty like `dispatch()`.

If dispatch was given an observable then the underlying wrapping observable will stay alive until the dispatched observable completes. So dispatching an observable allows long running subscription type dispatching regardles of using allowMore.

If you don't want to deal with creating observables of your own, the allowMore option allows you to perform multiple dispatch as well. Set `{ allowMore: true }` to keep open the dispatching until you are ready to complete, then call dispatch one final time with allowMore: false or just using the default options `dispatch(action)` or `dispatch()`.

An example of performing multiple dispatches without using an observable:

```js
process({ getState, action }, dispatch) {
  dispatch({ type: BAR }, { allowMore: true }); // keep dispatch open
  dispatch({ type: CAT }, { allowMore: true }); // keep dispatch open
  dispatch({ type: DOG }); // dispatch and complete
}
```

You could instead dispatch an observable and perform any number of dispatches inside of it. It controls when things complete or whether they stay open for a long running subscription.

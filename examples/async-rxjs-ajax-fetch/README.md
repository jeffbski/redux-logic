# Async RxJS ajax Fetch

This is an example of using redux-logic for async fetching with RxJS ajax triggered by a `users/FETCH` action type.

It is built using redux-actions to help with creating simple action creators and reducers.

Since RxJS ajax supports XHR abort on cancellation not only is redux-logic is able to fully cancel in-flight requests instantly. With other libraries like axios and fetch there is no mechanism to abort the request so the best that redux-logic can do is to ignore the response of a cancelled request. By dispatching the RxJS ajax observable to redux-logic, cancellation and take latest can abort the requests immediately.

It showcases some of the declarative functionality built into redux-logic, so simply by specifying a cancelType and setting latest to true, we enable this code to be cancellable and also enable it to only take the latest request if multiple come in. No additional code had to be written by us to leverage that functionality.

Finally we are also showcasing that runtime dependencies can be injected rather than hard coded into your logic. So while I could have used axios directly in this code, by injecting it I can now easily mock it out when testing.


```js
// in src/users/logic.js
import { createLogic } from 'redux-logic';

export const usersFetchLogic = createLogic({
  type: usersFetch,
  cancelType: usersFetchCancel,
  latest: true, // take latest only

  process({ httpClient }, dispatch, done) {
    // dispatch the results of the observable
    dispatch(
      // httpClient is RxJS ajax injected in the src/configureStore.js
      // as a dependency for logic hooks to use. It returns observable
      // the delay query param adds arbitrary delay to the response
      httpClient.getJSON(`https://reqres.in/api/users?delay=${delay}`)
        .map(payload => payload.data) // use data property of payload
        .map(users => usersFetchFulfilled(users))
        .catch(err => Observable.of(usersFetchRejected(err)))
    );
    done(); // call when done dispatching
  }
});
```

## Files of interest

 - [src/configureStore.js](./src/configureStore.js) - logicMiddleware is created with the combined array of logic for the app. Also the dependencies are defined that will be made available to all logic, so RxJS ajax is defined as httpClient.

 - [src/rootLogic.js](./src/rootLogic.js) - combines logic from all other parts of the app and defines the order they appear in the logic pipeline. Shows how you can structure large apps to easily combine logic.

 - [src/users/logic.js](./src/users/logic.js) - the logic specific to the users part of the app, this contains our async fetch logic

 - [src/users/actions.js](./src/users/actions.js) - contains the action creators created with redux-actions

 - [src/users/reducer.js](./src/users/reducer.js) - contains a reducer which handles all the users specific state. Created using redux-actions. Also contains the users related selectors. By collocating the reducer and the selectors we only have to update this one file to change the shape of our reducer state.

 - [src/users/component.js](./src/users/component.js) - Users React.js component for displaying the status, fetch + cancel buttons, and the list of users

 - [src/App.js](./src/App.js) - App component which uses redux connect to provide the users state and bound action handlers as props

 - [test/fetch-users-logic.spec.js](./test/fetch-users-logic.spec.js) - testing users fetch logic in isolation

## Usage

```bash
npm install # install dependencies
npm start # builds and runs dev server
```

Click fetch button which dispatches a simple `users/FETCH` action, that the logicMiddleware picks up, hands to fetchUsersLogic and runs the code in the process hook creating async fetch which eventually resolves and is handed to `usersFetchFullfilled` action creator or `usersFetchRejected` error action creator before being dispatched.

Note: To slow things down so you can interactively cancel and test the take latest functionality, I have added a delay query param to the URL which delays the response by 4 seconds. This allows you time to click cancel or to click fetch multiple times to see that it will only result in the latest result being fulfilled.

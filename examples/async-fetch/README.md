# Async Fetch

This is an example of using redux-logic for async fetching with axios triggered by a `users/FETCH` action type.

It is built using redux-actions to help with creating simple action creators and reducers.

It showcases some of the declarative functionality built into redux-logic, so simply by specifying a cancelType and setting latest to true, we enable this code to be cancellable and also enable it to only take the latest request if multiple come in. No code had to be written by us to leverage that functionality.

Finally we are also showcasing that runtime dependencies can be injected rather than hard coded into your logic. So while I could have used axios directly in this code, by injecting it I can now easily mock it out when testing.


```js
// in src/users/logic.js

export const usersFetchLogic = createLogic({
  type: usersFetch,
  cancelType: usersFetchCancel,
  latest: true, // take latest only

  // use axios injected as httpClient from configureStore logic deps
  // we also have access to getState and action in the first argument
  // but they were not needed for this particular code
  process({ httpClient }, dispatch) {
    httpClient.get(`http://reqres.in/api/users`)
      .then(resp => resp.data.data) // use data property of payload
      .then(users => dispatch(usersFetchFulfilled(users)))
      .catch((err) =>
             dispatch(usersFetchRejected(err)));
  }
});
```

## Files of interest

 - [src/configureStore.js](./src/configureStore.js) - logicMiddleware is created with the combined array of logic for the app. Also the dependencies are defined that will be made available to all logic, so axios is defined as httpClient.

 - [src/rootLogic.js](./src/rootLogic.js) - combines logic from all other parts of the app and defines the order they appear in the logic pipeline. Shows how you can structure large apps to easily combine logic.

 - [src/users/logic.js](./src/users/logic.js) - the logic specific to the users part of the app, this contains our async fetch logic

 - [src/users/actions.js](./src/users/actions.js) - contains the action creators created with redux-actions

 - [src/users/reducer.js](./src/users/reducer.js) - contains a reducer which handles all the users specific state. Created using redux-actions. Also contains the users related selectors. By collocating the reducer and the selectors we only have to update this one file to change the shape of our reducer state.

 - [src/users/component.js](./src/users/component.js) - Users React.js component for displaying the status, fetch + cancel buttons, and the list of users

 - [src/App.js](./src/App.js) - App component which uses redux connect to provide the users state and bound action handlers as props

 - [test/fetch-users-logic.spec.js](./test/fetch-users-logic.spec.js) - testing users fetch logic in isolation

## Usage

```bash
npm start # builds and runs dev server
```

Click fetch button which dispatches a simple `users/FETCH` action, that the logicMiddleware picks up, hands to fetchUsersLogic and runs the code in the process hook creating async fetch which eventually resolves and is handed to `usersFetchFullfilled` action creator or `usersFetchRejected` error action creator before being dispatched.

Note: To slow things down so you can interactively cancel and test the take latest functionality, I have added in a setTimeout to delay the resolution by 4 seconds. This allows you time to click cancel or to click fetch multiple times to see that it will only result in the latest result being fulfilled.

# Single file - Async Fetch example

This is an example of using redux-logic for async fetching with axios triggered by a `USERS_FETCH` action type.

It is built in a single file so you can see everything together in one place.

It showcases some of the declarative functionality built into redux-logic, so simply by specifying a cancelType and setting latest to true, we enable this code to be cancellable and also enable it to only take the latest request if multiple come in. No code had to be written by us to leverage that functionality.

Finally we are also showcasing that runtime dependencies can be injected rather than hard coded into your logic. So while I could have used axios directly in this code, by injecting it I can now easily mock it out when testing.


```js
// in src/index.js

const usersFetchLogic = createLogic({
  type: USERS_FETCH,
  cancelType: USERS_FETCH_CANCEL,
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

 - [src/index.js](./src/index.js) - All example code

## Usage

```bash
npm start # builds and runs dev server
```

Click fetch button which dispatches a simple `USERS_FETCH` action, that the logicMiddleware picks up, hands to fetchUsersLogic and runs the code in the process hook creating async fetch which eventually resolves and then dispatches a `USERS_FETCH_FULFILLED` or `USERS_FETCH_REJECTED` action.

Note: To slow things down so you can interactively cancel and test the take latest functionality, I have added a delay query param to the URL which delays the response by 2 seconds. This allows you time to click cancel or to click fetch multiple times to see that it will only result in the latest result being fulfilled.

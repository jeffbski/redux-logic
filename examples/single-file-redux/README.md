# Single file redux - Async Fetch example - redux only

This is an example of using redux-logic for async fetching with axios triggered by a `USERS_FETCH` action type. This example is only showcasing redux (not using a UI library like React). The output of the state is just appended to the container div in the document.

It is built in a single file so you can see everything together in one place.

It showcases some of the declarative functionality built into redux-logic, so simply by specifying a cancelType and setting latest to true, we enable this code to be cancellable and also enable it to only take the latest request if multiple come in. No code had to be written by us to leverage that functionality.

Finally we are also showcasing that runtime dependencies can be injected rather than hard coded into your logic. So while I could have used axios directly in this code, by injecting it I can now easily mock it out when testing.


```js
// in src/index.js
import { createLogic } from 'redux-logic';

const usersFetchLogic = createLogic({
  type: USERS_FETCH,
  cancelType: USERS_FETCH_CANCEL,
  latest: true, // take latest only

  // use axios injected as httpClient from configureStore logic deps
  // we also have access to getState and action in the first argument
  // but they were not needed for this particular code
  process({ httpClient }, dispatch, done) {
    httpClient.get(`https://reqres.in/api/users`)
      .then(resp => resp.data.data) // use data property of payload
      .then(users => dispatch(usersFetchFulfilled(users)))
      .catch((err) => {
        console.error(err); // might be a render err
        dispatch(usersFetchRejected(err));
      })
      .then(() => done()); // call done when finished dispatching
  }
});
```

## Files of interest

 - [src/index.js](./src/index.js) - All example code

## Usage

```bash
npm install # install dependencies
npm start # builds and runs dev server
```

This example just has the dispatching built into the code so you can just watch what happens after:

 - fetch
 - cancel - cancels our fetch
 - fetch
 - fetch - since `latest` is specified only last one is used

Note: To slow things down so you can see what happens with cancel and take latest functionality, I have added a delay query param to the URL which delays the response by 2 seconds.

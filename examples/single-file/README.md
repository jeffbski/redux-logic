# Single file - Search Async Fetch

This is an example of using redux-logic for search with async fetching using axios triggered by a `NPM_SEARCH` action type.

It is built in a single file so you can see everything together in one place.

It showcases some of the declarative functionality built into redux-logic, debouncing and setting latest to true, we enable this code to automatically debounce requests and then only use response data from the latest one if multiple were made. No code had to be written by us to leverage that functionality.

Finally we are also showcasing that runtime dependencies can be injected rather than hard coded into your logic. So while I could have used axios directly in this code, by injecting it I can now easily mock it out when testing.


```js
// in src/index.js
import { createLogic } from 'redux-logic';

const npmSearchLogic = createLogic({
  type: NPM_SEARCH,
  debounce: 500, // ms
  latest: true, // take latest only

  // only allow non-empty payloads
  validate({ getState, action }, allow, reject) {
    if (action.payload) {
      allow(action);
    } else { // empty request, silently reject
      reject();
    }
  },

  // use axios injected as httpClient from configureStore logic deps
  process({ httpClient, getState, action }, dispatch, done) {
    httpClient.get(`https://npmsearch.com/query?q=${action.payload}&fields=name,description`)
      .then(resp => resp.data.results) // use results prop of payload
      .then(results => dispatch({
        type: NPM_SEARCH_FULFILLED,
        payload: results
      }))
      .catch((err) => {
        console.error(err); // might be a render err
        dispatch({
          type: NPM_SEARCH_REJECTED,
          payload: err,
          error: true
        })
      })
      .then(() => done()); // call when done dispatching
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

Type keywords into the input box to trigger npm searches via `NPM_SEARCH` actions.

The logicMiddleware picks up those requests and hands it to npmSearchLogic. In the logic debounce of 500 (ms) has been specified along with latest, so if actions are coming in they will be suppressed until there is 500ms of inactivity when they will allowed to go through. With `latest` being set true, the `take latest` feature is enabled so that if multiple requests are made, only the data corresponding to the latest request will be used.

The logic also uses a simple validation to check whether the query payload is not empty and if to then allows the action to flow through, otherwise it silently rejects it.

Finally in the process hook the search is being made with axios to npmsearch.com and the results are dispatched with `NPM_SEARCH_FULFILLED` on success or `NPM_SEARCH_REJECTED` on error.

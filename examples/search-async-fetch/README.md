# Search Async Fetch

This is an example of using redux-logic for async searching via axios triggered by a `SEARCH` action type. The searches are debounced and only the latest is used.

It showcases some of the declarative functionality built into redux-logic, so simply by specifying a debounce time and setting latest to true, we enable this code to be debounce the actions and also enable it to only use the results corresponding to the latest request (even if the results come in out of order). No code had to be written by us to leverage that functionality.

We have a simple validation hook that checks whether the search request is empty or else it silently rejects it. This prevents the process hook from running. By rejecting without an action (undefined), nothing is passed on to the reducers, it is silently dropped.

Finally we are also showcasing that runtime dependencies can be injected rather than hard coded into your logic. So while I could have used axios directly in this code, by injecting it I can now easily mock it out when testing.


```js
// in src/search/logic.js
import { createLogic } from 'redux-logic';

export const searchLogic = createLogic({
  type: SEARCH,
  debounce: 500, // ms
  latest: true, // take latest only

  // let's prevent empty requests
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
      .then(resp => resp.data.results) // use results property of payload
      .then(results => dispatch(searchFulfilled(results)))
      .catch((err) => {
        console.error(err); // might be a render err
        dispatch(searchRejected(err))
      })
      .then(() => done()); // call done when finished dispatching
  }
});
```

## Files of interest

 - [src/configureStore.js](./src/configureStore.js) - logicMiddleware is created with the combined array of logic for the app. Also the dependencies are defined that will be made available to all logic, so axios is defined as httpClient.

 - [src/rootLogic.js](./src/rootLogic.js) - combines logic from all other parts of the app and defines the order they appear in the logic pipeline. Shows how you can structure large apps to easily combine logic.

 - [src/search/logic.js](./src/search/logic.js) - the logic specific to the search part of the app, this contains our async fetch logic

 - [src/search/actions.js](./src/search/actions.js) - contains the action creators

 - [src/search/reducer.js](./src/search/reducer.js) - contains a reducer which handles all the search specific state. Also contains the search related selectors. By collocating the reducer and the selectors we only have to update this one file to change the shape of our reducer state.

 - [src/search/component.js](./src/search/component.js) - Search React.js component for displaying the status, search input, and the list of search results

 - [src/App.js](./src/App.js) - App component which uses redux connect to provide the search state and bound action handlers as props

 - [test/search-logic.spec.js](./test/search-logic.spec.js) - testing search logic in isolation

## Usage

```bash
npm install # install dependencies
npm start # builds and runs dev server
```

Type some keywords and on each keystroke a change event is firing a search action. The searchLogic debounces those so that only after 500ms of inactivity witll the search be passed through. Also if the search changes again before the results return, the "take latest" feature ensures that only the results correpsonding to the last search will be used (even if they arrive out of order).

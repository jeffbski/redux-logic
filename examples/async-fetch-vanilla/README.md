# Async Fetch Vanilla

This is an example of using redux-logic for async fetching with axios triggered by a `POLLS_FETCH` action type.

It builds action creators and reducers without using any helper libraries.

It showcases some of the declarative functionality built into redux-logic, so simply by specifying a cancelType and setting latest to true, we enable this code to be cancellable and also enable it to only take the latest request if multiple come in. No code had to be written by us to leverage that functionality.

Finally we are also showcasing that runtime dependencies can be injected rather than hard coded into your logic. So while I could have used axios directly in this code, by injecting it I can now easily mock it out when testing.


```js
// in src/polls/logic.js

const fetchPollsLogic = createLogic({
  type: POLLS_FETCH,
  cancelType: POLLS_FETCH_CANCEL,
  latest: true, // take latest only

  // use axios injected as httpClient from configureStore logic deps
  // we also have access to getState and action in the first argument
  // but they were not needed for this particular code
  process({ httpClient }, dispatch) {
    httpClient.get('https://survey.codewinds.com/polls')
      .then(resp => resp.data.polls)
      .then(polls => dispatch(pollsFetchFulfilled(polls)))
      .catch((err) =>
             dispatch(pollsFetchRejected(err)));
  }
});
```

## Files of interest

 - `src/configureStore.js` - logicMiddleware is created with the combined array of logic for the app. Also the dependencies are defined that will be made available to all logic, so axios is defined as httpClient.

 - `src/rootLogic.js` - combines logic from all other parts of the app and defines the order they appear in the logic pipeline. Shows how you can structure large apps to easily combine logic.

 - `src/polls/logic.js` - the logic specific to the polls part of the app, this contains our async fetch logic

 - `src/polls/actions.js` - contains the action creators

 - `src/polls/reducer.js` - contains a reducer which handles all the polls specific state. Also contains the polls related selectors. By collocating the reducer and the selectors we only have to update this one file to change the shape of our reducer state.

 - `src/polls/component.js` - Polls React.js component for displaying the status, fetch + cancel buttons, and the list of polls

 - `src/App.js` - App component which uses redux connect to provide the polls state and bound action handlers as props

 - `test/fetch-polls-logic.spec.js` - testing pollsFetch logic in isolation

## Usage

```bash
npm start # builds and runs dev server
```

Click fetch button which dispatches a simple `POLLS_FETCH` action, that the logicMiddleware picks up, hands to fetchPollsLogic and runs the code in the process hook creating async fetch which eventually resolves and is handed to `pollsFetchFullfilled` action creator or `pollsFetchRejected` error action creator before being dispatched.

Note: To slow things down so you can interactively cancel and test the take latest functionality, I have added in a setTimeout to delay the resolution by 4 seconds. This allows you time to click cancel or to click fetch multiple times to see that it will only result in the latest result being fulfilled.

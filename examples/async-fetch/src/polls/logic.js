import { createLogic } from 'redux-logic';
import { pollsFetch, pollsFetchCancel, pollsFetchFulfilled,
         pollsFetchRejected } from './actions';

const fetchPollsLogic = createLogic({
  type: pollsFetch,
  cancelType: pollsFetchCancel,
  latest: true, // take latest only

  // use axios injected as httpClient from configureStore logic deps
  // we also have access to getState and action in the first argument
  // but they were not needed for this particular code
  process({ httpClient }, dispatch) {
    // using setTimeout to put in artificial delay so user can
    // play with cancellation and takeLatest functionality
    // Real code would not be wrapped with setTimeout
    setTimeout(() => {
      httpClient.get('https://survey.codewinds.com/polls')
        .then(resp => resp.data.polls)
        .then(polls => dispatch(pollsFetchFulfilled(polls)))
        .catch((err) =>
               dispatch(pollsFetchRejected(err)));
    }, 4000);
  }
});



/* Real world code would be more like this without the setTimeout

const fetchPollsLogic = createLogic({
  type: pollsFetch,
  cancelType: pollsFetchCancel,
  latest: true, // take latest only

  // use axios injected as httpClient from configureStore logic deps
  process({ httpClient }, dispatch) {
    httpClient.get('https://survey.codewinds.com/polls')
      .then(resp => resp.data.polls)
      .then(polls => dispatch(pollsFetchFulfilled(polls)))
      .catch((err) =>
             dispatch(pollsFetchRejected(err)));
  }
});

*/


export default [
  fetchPollsLogic
];

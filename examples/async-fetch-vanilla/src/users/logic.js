import { createLogic } from 'redux-logic';
import { USERS_FETCH, USERS_FETCH_CANCEL, usersFetchFulfilled,
         usersFetchRejected } from './actions';

const delay = 4; // 4s delay for interactive use of cancel/take latest

export const usersFetchLogic = createLogic({
  type: USERS_FETCH,
  cancelType: USERS_FETCH_CANCEL,
  latest: true, // take latest only

  // use axios injected as httpClient from configureStore logic deps
  // we also have access to getState and action in the first argument
  // but they were not needed for this particular code
  process({ httpClient }, dispatch, done) {
    // the delay query param adds arbitrary delay to the response
    httpClient.get(`https://reqres.in/api/users?delay=${delay}`)
      .then(resp => resp.data.data) // use data property of payload
      .then(users => dispatch(usersFetchFulfilled(users)))
      .catch((err) => {
        console.error(err); // might be a render err
        dispatch(usersFetchRejected(err))
      })
      .then(() => done());
  }
});

export default [
  usersFetchLogic
];

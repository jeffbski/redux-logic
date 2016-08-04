import { createLogic } from 'redux-logic';
import { usersFetch, usersFetchCancel, usersFetchFulfilled,
         usersFetchRejected } from './actions';

const delay = 4; // 4s delay for interactive use of cancel/take latest

export const fetchUsersLogic = createLogic({
  type: usersFetch,
  cancelType: usersFetchCancel,
  latest: true, // take latest only

  // use axios injected as httpClient from configureStore logic deps
  // we also have access to getState and action in the first argument
  // but they were not needed for this particular code
  process({ httpClient }, dispatch) {
    // the delay query param adds arbitrary delay to the response
    httpClient.get(`http://reqres.in/api/users?delay=${delay}`)
      .then(resp => resp.data.data) // use data property of payload
      .then(users => dispatch(usersFetchFulfilled(users)))
      .catch((err) =>
             dispatch(usersFetchRejected(err)));
  }
});


export default [
  fetchUsersLogic
];

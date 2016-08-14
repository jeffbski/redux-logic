import { createLogic } from 'redux-logic';
import { USER_PROFILE_FETCH, USER_PROFILE_FETCH_CANCEL, userProfileFetchFulfilled,
         userProfileFetchRejected } from './actions';

const delay = 2; // 2s delay for interactive use of cancel/take latest

export const userProfFetchLogic = createLogic({
  type: USER_PROFILE_FETCH,
  cancelType: USER_PROFILE_FETCH_CANCEL,
  latest: true, // take latest only

  // use axios injected as httpClient from configureStore logic deps
  // we also have access to getState and action in the first argument
  // but they were not needed for this particular code
  process({ httpClient, action }, dispatch) {
    const uid = action.payload;

    async function fetchUserAndProfile() {
      try {
        // the delay query param adds arbitrary delay to the response
        const user =
          await httpClient.get(`http://reqres.in/api/users/${uid}?delay=${delay}`)
            .then(resp => resp.data.data); // use data property of payload

        // we can use data from user to fetch fake profile
        const profile =
          await httpClient.get(`http://reqres.in/api/profile/${user.id}`)
            .then(resp => resp.data.data);

        user.profile = profile; // combine profile into user object
        dispatch(userProfileFetchFulfilled(user)); // user with profile
      } catch(err) {
        dispatch(userProfileFetchRejected(err));
      }
    }

    // now run it
    fetchUserAndProfile();
  }
});



export default [
  userProfFetchLogic
];

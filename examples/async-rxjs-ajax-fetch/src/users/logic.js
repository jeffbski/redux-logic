import { createLogic } from 'redux-logic';
import { usersFetch, usersFetchCancel, usersFetchFulfilled,
         usersFetchRejected } from './actions';

import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

const delay = 4; // 4s delay for interactive use of cancel/take latest

export const usersFetchLogic = createLogic({
  type: usersFetch,
  cancelType: usersFetchCancel,
  latest: true, // take latest only

  process({ httpClient }, dispatch, done) {
    // dispatch the results of the observable
    dispatch(
      // httpClient is RxJS ajax injected in the src/configureStore.js
      // as a dependency for logic hooks to use. It returns observable
      // the delay query param adds arbitrary delay to the response
      httpClient.getJSON(`https://reqres.in/api/users?delay=${delay}`).pipe(
        map(payload => payload.data), // use data property of payload
        map(users => usersFetchFulfilled(users)),
        catchError(err => of(usersFetchRejected(err)))
      )
    );
    done(); // call when done dispatching
  }
});


export default [
  usersFetchLogic
];

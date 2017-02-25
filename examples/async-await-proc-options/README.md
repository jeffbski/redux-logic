# Async Await - Async Functions with processOptions

This is an example of using redux-logic for async fetching with axios triggered by a `USERS_FETCH` action type and implemented using async functions (async/await) and the new processOptions feature in redux-logic which cleans up the code further.

The `processOptions` feature allows you to enable the ability to simply return a promise or observable and apply the appropriate actions to the resolving/rejecting values. The resulting code is very concise and even easier to test.

It builds action creators and reducers without using any helper libraries.

It showcases some of the declarative functionality built into redux-logic, so simply by specifying a cancelType and setting latest to true, we enable this code to be cancellable and also enable it to only take the latest request if multiple come in. No code had to be written by us to leverage that functionality.

Finally we are also showcasing that runtime dependencies can be injected rather than hard coded into your logic. So while I could have used axios directly in this code, by injecting it I can now easily mock it out when testing.


```js
// in src/users/logic.js
import { createLogic } from 'redux-logic';

export const usersFetchLogic = createLogic({
  type: USERS_FETCH,
  cancelType: USERS_FETCH_CANCEL,
  latest: true, // take latest only

  processOptions: {
    dispatchReturn: true,
    successType: usersFetchFulfilled,
    failType: usersFetchRejected
  },

  // use axios injected as httpClient from configureStore logic deps
  // we also have access to getState and action in the first argument
  // but they were not needed for this particular code
  async process({ httpClient }) {
      // the delay query param adds arbitrary delay to the response
      const users =
        await httpClient.get(`https://reqres.in/api/users?delay=${delay}`)
                        .then(resp => resp.data.data); // use data property of payload
      return users;
  }
});
```

```js
// in src/user/logic.js
// Here I chose to separate out the main fetch code into an external
// async function
import { createLogic } from 'redux-logic';

export const userProfFetchLogic = createLogic({
  type: USER_PROFILE_FETCH,
  cancelType: USER_PROFILE_FETCH_CANCEL,
  latest: true, // take latest only

  processOptions: {
    dispatchReturn: true,
    successType: userProfileFetchFulfilled,
    failType: userProfileFetchRejected
  },

  // use axios injected as httpClient from configureStore logic deps
  // we also have access to getState and action in the first argument
  // but they were not needed for this particular code
  process({ httpClient, action }) {
    const uid = action.payload;
    return fetchUserWithProfile(httpClient, uid);
  }
});

/**
  Makes request to get user, then requests profile and merges them.
  Note: async function returns a promise which resolves to the user.
  @param {object} httpClient - axios like client
  @return {promise} userPromise - promise resolving to user with profile
  @throws {error} fetchError - any fetching error
 */
async function fetchUserWithProfile(httpClient, uid) {
  // the delay query param adds arbitrary delay to the response
  const user =
    await httpClient.get(`https://reqres.in/api/users/${uid}?delay=${delay}`)
      .then(resp => resp.data.data); // use data property of payload

  // we can use data from user to fetch fake profile
  const profile =
    await httpClient.get(`https://reqres.in/api/profile/${user.id}`)
      .then(resp => resp.data.data);

  user.profile = profile; // combine profile into user object
  return user;
}
```

## Files of interest

 - [src/configureStore.js](./src/configureStore.js) - logicMiddleware is created with the combined array of logic for the app. Also the dependencies are defined that will be made available to all logic, so axios is defined as httpClient.

 - [src/rootLogic.js](./src/rootLogic.js) - combines logic from all other parts of the app and defines the order they appear in the logic pipeline. Shows how you can structure large apps to easily combine logic.

 - [src/App.js](./src/App.js) - App component which uses redux connect to provide the users and user components state and bound action handlers as props

 - **List of Users** related code

   - [src/users/logic.js](./src/users/logic.js) - the logic specific to the users part of the app, this contains our async fetch logic

   - [src/users/actions.js](./src/users/actions.js) - contains the action creators for users

   - [src/users/reducer.js](./src/users/reducer.js) - contains a reducer which handles all the users specific state. Also contains the users related selectors. By collocating the reducer and the selectors we only have to update this one file to change the shape of our reducer state.

   - [src/users/component.js](./src/users/component.js) - Users React.js component for displaying the status, fetch + cancel buttons, and the list of users

   - [test/users-fetch-logic.spec.js](./test/users-fetch-logic.spec.js) - testing usersFetch logic in isolation


 - **Selected User** related code

   - [src/user/logic.js](./src/user/logic.js) - the logic specific to the user part of the app, this contains our async fetch logic for fetching a user followed by its profile

   - [src/user/actions.js](./src/user/actions.js) - contains the action creators for user

   - [src/user/reducer.js](./src/user/reducer.js) - contains a reducer which handles all the user specific state. Also contains the user related selectors. By collocating the reducer and the selectors we only have to update this one file to change the shape of our reducer state.

   - [src/user/component.js](./src/user/component.js) - User React.js component for displaying a user profile



## Usage

```bash
npm install # install dependencies
npm start # builds and runs dev server
```

Click on the "Fetch Users" button to initiate a fetch of users. Click cancel to abort the fetch, or click the "Fetch Users" button multiple times to see that only the last fetch is used.

Once the list of users is displayed, click on any of the user buttons to fetch the details for that user. You may click the "Cancel User Fetch" button to cancel a fetch or simply click on another user button and the previous fetch will be ignored when it completes.

Note: To slow things down so you can interactively cancel and test the take latest functionality, I have added a delay query param to the URL which delays the response by 2 seconds. This allows you time to click cancel or to click fetch multiple times to see that it will only result in the latest result being fulfilled.

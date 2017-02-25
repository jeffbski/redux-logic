# Notification

This is an example of using redux-logic to govern the logic for a notification feature. Specifically the busines requirement is that there would be N number of notifications on the screen at one time. They would be displayed for a set period of time and as slots become available any pending notifcations would take their place.

So in essence there would be a queue of notifications to display and we'd be only showing a max of N messages at a time.

The button click will iniate an action of type `NOTIFY_CREATE`. Our notifyCreateLogic will see this message and it's `validate` hook will check the state to see if there is available room to display and that there are no queued messages waiting for display. If both of these are true the action is allowed through and the message will be immediately added to the display by the reducer. `notifyCreateLogic`'s `process` hook then sets up a timer to dispatch a `NOTIFY_REMOVE` message with the msg to remove it after it has been displayed for X seconds.

If the current notification list is already showing 3 messages, the max allowed, then `notifyCreateLogic`'s `validate` hook will instead reject sending instead a `NOTIFY_QUEUE` action with the same payload.

The `notifyRemoveLogic`'s `process` hook checks to see whether there are any messages still in the queue and if so it dispatches a `NOTIFY_DISPLAY_QUEUED` action.

The notify reducer takes care of just doing the basic state updates like adding, removing, moving from queue to current display. It doesn't have to worry about any of the specfic business logic since that is all being handled in the logic.

The `notifyQueuedLogic` doesn't need to do much since the reducer does most of its work. It does check the current messages and if they are empty then dispatches a NOTIFY_DISPLAY_QUEUED to wake things up. Normally those actions are sent after removing if there are members in the queue, but just in case we got into a condition where there is nothing to trigger it, we'll dispatch to get things going.

Finally `notifyDisplayQueuedLogic` which checks to see if there are any slots to fill and any messages in the queue in its `validate` hook, then if so it populates the payload of that message before sending it down to the reducer. It also then sets up a timed NOTIFY_REMOVE dispatch where it will include they messages just displayed so they will remove themselves after being up for the predetermined time.

And since NOTIFY_REMOVES check the queue, they will continue the process until all messages have been rendered.




```js
// in src/notify/logic.js
import { createLogic } from 'redux-logic';

export const notifyCreateLogic = createLogic({
  type: NOTIFY_CREATE,

  // check to see if we can add directly
  validate({ getState, action }, allow, reject) {
    const state = getState();
    const current = notifySel.messages(state);
    const queue = notifySel.queue(state);
    if (current.length < MAX_DISPLAY && !queue.length) {
      allow(action);
    } else {
      reject(notifyQueue(action.payload));
    }
  },

  // if we had added directly then schedule remove
  process({ action }, dispatch, done) {
    const msg = action.payload;
    setTimeout(() => {
      dispatch(notifyRemove([msg]));
      done(); // call when done dispatching
    }, DISPLAY_TIME);
  }
});

export const notifyRemoveLogic = createLogic({
  type: NOTIFY_REMOVE,

  // everytime we remove an item, if queued, send action to display one
  process({ getState, action }, dispatch, done) {
    // unless other middleware/logic introduces async behavior, the
    // state will have been updated by the reducers before process runs
    const state = getState();
    const queue = notifySel.queue(state);
    if (queue.length) {
      dispatch(notifyDisplayQueued());
    }
    done(); // we are done dispatching
  }
});

export const notifyQueuedLogic = createLogic({
  type: NOTIFY_QUEUE,

  // after we queue an item, if display is already clear
  // we add in a displayQueued to ensure things aren't stuck
  process({ getState }, dispatch, done) {
    // just in case things had already cleared out,
    // check to see if can display yet, normally
    // any remove actions trigger this check but if already
    // empty we will queue one up for good measure
    setTimeout(() => {
      const state = getState();
      const current = notifySel.messages(state);
      if (!current.length) {
        dispatch(notifyDisplayQueued());
      }
      // the next remove will trigger display
      done(); // we are done dispatching
    }, 100);
  }
});

export const notifyDisplayQueuedLogic = createLogic({
  type: NOTIFY_DISPLAY_QUEUED,

  // if we have opening(s) and queued, display them
  validate({ getState, action }, allow, reject) {
    const state = getState();
    const current = notifySel.messages(state);
    const queue = notifySel.queue(state);
    const needed = MAX_DISPLAY - current.length;
    if (needed > 0 && queue.length) {
      allow({
        ...action,
        payload: queue.slice(0, needed)
      });
    } else {
      reject(); // preventing msg from continuing
    }
  },

  // schedule removes for those displayed
  process({ action }, dispatch, done) {
    const arrMsgs = action.payload;
    setTimeout(() => {
      dispatch(notifyRemove(arrMsgs));
      done(); // we are done dispatching
    }, DISPLAY_TIME);
  }
});
```

## Files of interest

 - [src/configureStore.js](./src/configureStore.js) - logicMiddleware is created with the combined array of logic for the app.

 - [src/rootLogic.js](./src/rootLogic.js) - combines logic from all other parts of the app and defines the order they appear in the logic pipeline. Shows how you can structure large apps to easily combine logic.

 - [src/notify/logic.js](./src/notify/logic.js) - the logic specific to the notify part of the app, this contains our notify logic

 - [src/notify/actions.js](./src/notify/actions.js) - contains the action creators

 - [src/notify/reducer.js](./src/notify/reducer.js) - contains a reducer which handles all the notify specific state. Also contains the notify related selectors. By collocating the reducer and the selectors we only have to update this one file to change the shape of our reducer state.

 - [src/notify/component.js](./src/notify/component.js) - Notify React.js component for displaying current messages, queue, and the "create notification" button.

 - [src/App.js](./src/App.js) - App component which uses redux connect to provide the notify component state and bound action handlers as props

 - [test/notify-create-logic.spec.js](./test/notify-create-logic.spec.js) - test for the validate hook of notifyCreateLogic.

## Usage

```bash
npm install # install dependencies
npm start # builds and runs dev server
```

Click the "Create Notification" button repeatedly to create some notifications. You can see that if you create many they will start to queue up once you pass the 3 message maximum. After 3 seconds of display a message will be removed and another in the queue moved to replace it.

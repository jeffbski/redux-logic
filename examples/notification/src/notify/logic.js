import { createLogic } from 'redux-logic';

import { NOTIFY_CREATE, NOTIFY_REMOVE, NOTIFY_QUEUE,
         NOTIFY_DISPLAY_QUEUED,
         notifyQueue, notifyRemove, notifyDisplayQueued
       } from './actions';

import { selectors as notifySel } from './reducer';

export const MAX_DISPLAY = 3;
export const DISPLAY_TIME = 3000;

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
      done(); // we are done dispatching
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

export default [
  notifyCreateLogic,
  notifyRemoveLogic,
  notifyQueuedLogic,
  notifyDisplayQueuedLogic
];

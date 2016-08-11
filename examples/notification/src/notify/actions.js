import shortid from 'shortid';

// unique key namespace used by combineReducers.
// By convention it will match the directory structure to
// make it easy to locate the src.
// Also action types will prefix with the capitalized version
export const key = 'notify';

// action type constants
export const NOTIFY_CREATE = 'NOTIFY_CREATE';
export const NOTIFY_QUEUE = 'NOTIFY_QUEUE';
export const NOTIFY_REMOVE = 'NOTIFY_REMOVE';
export const NOTIFY_DISPLAY_QUEUED = 'NOTIFY_DISPLAY_QUEUED';

export const actionTypes = {
  NOTIFY_CREATE,
  NOTIFY_QUEUE,
  NOTIFY_REMOVE,
  NOTIFY_DISPLAY_QUEUED
};


// action creators
export const notifyCreate = () => ({ type: NOTIFY_CREATE,
                                     payload: shortid.generate() });
export const notifyQueue = (id) => ({ type: NOTIFY_QUEUE,
                                      payload: id });
export const notifyRemove = (arrIds) => ({ type: NOTIFY_REMOVE,
                                           payload: arrIds });
export const notifyDisplayQueued = () => ({ type: NOTIFY_DISPLAY_QUEUED });

export const actions = {
  notifyCreate,
  notifyQueue,
  notifyRemove,
  notifyDisplayQueued
};

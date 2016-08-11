import { key, NOTIFY_CREATE, NOTIFY_QUEUE, NOTIFY_REMOVE, NOTIFY_DISPLAY_QUEUED } from './actions';

export const selectors = {
  messages: state => state[key].messages,
  queue: state => state[key].queue
};

const initialState = {
  messages: [],
  queue: []
};

export default function reducer(state = initialState, action) {
  switch(action.type) {
  case NOTIFY_CREATE :
    return {
        ...state,
      messages: [...state.messages, action.payload]
    };
  case NOTIFY_QUEUE :
    return {
      ...state,
      queue: [...state.queue, action.payload]
    };
  case NOTIFY_REMOVE :
    return {
      ...state,
      messages: state.messages
        .filter(m => action.payload.indexOf(m) === -1)
    };
  case NOTIFY_DISPLAY_QUEUED :
    {
      const msgs = action.payload;
      return {
          ...state,
        messages: [...state.messages, ...msgs],
        queue: state.queue.filter(m => msgs.indexOf(m) === -1)
      };
    }
  default:
    return state;
  }
}

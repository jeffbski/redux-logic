import { key, TIMER_START, TIMER_CANCEL, TIMER_RESET, TIMER_END,
         TIMER_DECREMENT, TIMER_START_ERROR } from './actions';

export const selectors = {
  value: state => state[key].value,
  status: state => state[key].status
};

const initialState = {
  value: 10,
  status: 'stopped'
};

export default function reducer(state = initialState, action) {
  switch(action.type) {
  case TIMER_START:
    return {
      ...state,
      status: 'started'
    };
  case TIMER_CANCEL:
    return {
      ...state,
      status: 'stopped'
    };
  case TIMER_RESET:
    return {
      ...state,
      status: 'stopped',
      value: 10
    };
  case TIMER_END:
    return {
      ...state,
      status: 'ended'
    };
  case TIMER_DECREMENT:
    return {
        ...state,
      value: state.value - 1
    };
  case TIMER_START_ERROR:
    return {
      ...state,
      status: action.payload.message
    };
  default:
    return state;
  }
}

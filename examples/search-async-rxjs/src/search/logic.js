import { createLogic } from 'redux-logic';
import { SEARCH, searchFulfilled, searchRejected } from './actions';
import { map } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';

export const searchLogic = createLogic({
  type: SEARCH,
  debounce: 500, /* ms */
  latest: true,  /* take latest only */
  /* and since we are using rxjs ajax which returns an observable
     the XRH requests are automatically aborted when redux-logic
     cancels the observable */

  validate({ action }, allow, reject) {
    if (!action.payload) { reject(); }
    allow(action);
  },

  processOptions: {
    successType: searchFulfilled, // action creator to wrap success result
    failType: searchRejected      // action creator to wrap failed result
  },

  process({ getState, action }) {
    return ajax({
      url: `https://npmsearch.com/query?q=${action.payload}&fields=name,description`,
      crossDomain: true,
      responseType: 'json'
    }).pipe(
      map(ret => ret.response.results) // use results prop of payload
    );
  }
});

export default [
  searchLogic
];

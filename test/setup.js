import 'core-js/fn/promise';  // polyfill promise for tests

/*
   Note do not import Rx in here since this file is used in
   npm run test:rxbuild to test that things run without Rx being
   imported, checking that we have the appropriate operators
   imported in our source.
 */

/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   A test for the typescript definition
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2018 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { Action, ErroneousAction, StandardAction } from '../definitions/action';

//
// Action Type
//

const TEST_TYPE = 'type';
type TestType = typeof TEST_TYPE;

interface TestPayload {
  data: 'payload';
}

interface TestMeta {
  data: 'meta';
}

{
  const action: StandardAction = {
    type: TEST_TYPE
  };
}

{
  const action: ErroneousAction = {
    type: TEST_TYPE,
    payload: new Error('message'),
    error: true
  };
}

/* ----- Action ----- */

// The Action type should cover all types above.

{
  const action: Action = {
    type: TEST_TYPE
  };

  {
    // would fail if test is 'type' instread of string
    const test: string = action.type;
  }

  {
    // would fail if test is in ErroneousAction type
    const test: StandardAction = action;
  }
}

{
  const action: Action<TestType> = {
    type: TEST_TYPE
  };
  {
    // now action.type can be in the type of 'type'
    const test: TestType = action.type;
  }

  {
    // would fail if test is in ErroneousAction type
    const test: StandardAction<TestType> = action;
  }
}

{
  const action: Action<TestType> = {
    type: TEST_TYPE
  };
  {
    const test: TestType = action.type;
  }

  {
    // should pass with any the type for Payload and Meta
    const test: StandardAction<TestType, any, any> = action;
  }
}

{
  const action: Action<TestType, TestPayload, TestMeta> = {
    type: TEST_TYPE,
    payload: {
      data: 'payload'
    },
    meta: {
      data: 'meta'
    }
  };
  {
    const test: TestType = action.type;
  }

  {
    // should pass with any the type for Payload and Meta
    const test: StandardAction<TestType, any, any> = action;
  }
}

{
  const action: Action<TestType, TestPayload, TestMeta> = {
    type: TEST_TYPE,
    payload: {
      data: 'payload'
    },
    meta: {
      data: 'meta'
    }
  };

  // would fail if test is in ErroneousAction type
  const test: StandardAction<TestType, TestPayload, TestMeta> = action;
}

{
  const action: Action = {
    type: TEST_TYPE,
    payload: new Error('message'),
    error: true
  };

  // would fail if test is in StandardAction type
  const test: ErroneousAction = action;
}

{
  let action: Action;

  {
    const test: boolean | undefined = action.error;
  }

  if (action.error === true) {
    // would fail if test is in StandardAction type
    const test: ErroneousAction = action;
  } else {
    // would fail if test is in ErroneousAction type
    const test: StandardAction = action;
  }
}

{
  let action: Action<TestType, TestPayload, TestMeta>;

  {
    const test: boolean | undefined = action.error;
  }

  if (action.error === true) {
    // would fail if test is in StandardAction type
    const test: ErroneousAction<TestType, TestMeta> = action;
  } else {
    // would fail if test is in ErroneousAction type
    const test: StandardAction<TestType, TestPayload, TestMeta> = action;
  }
}

// ---------------------------------------- //

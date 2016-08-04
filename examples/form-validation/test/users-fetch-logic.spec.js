
import expect from 'expect';
import { USERS_FIELD_UPDATED, USERS_FIELD_INVALID } from '../src/users/actions';
import { usersUpdateValidationLogic } from '../src/users/logic';

describe('usersUpdateValidationLogic', () => {
  describe('clear first to blank form', () => {
    let allow;
    let reject;
    beforeEach((done) => {
      reject = expect.createSpy().andCall(() => done());
      allow = (act) => done(act); // call done as an error
      const getState = () => ({
        users: {
          fields: {
            first_name: 'hey',
            last_name: ''
          },
          errors: [],
          valid: false
        }
      });
      const action = {
        type: USERS_FIELD_UPDATED,
        payload: {
          name: 'first_name',
          value: ''
        }
      };
      usersUpdateValidationLogic.validate({ getState, action },
                                          allow, reject);
    });

    it('should reject with action USERS_FIELD_INVALID and 2 errors', () => {
      expect(reject.calls.length).toBe(1);
      expect(reject.calls[0].arguments[0].type).toBe(USERS_FIELD_INVALID);
      expect(reject.calls[0].arguments[0].payload.errors.length).toBe(2);
    });
  });

  describe('populate first, last empty', () => {
    let allow;
    let reject;
    beforeEach((done) => {
      reject = expect.createSpy().andCall(() => done());
      allow = (act) => done(act); // call done as an error
      const getState = () => ({
        users: {
          fields: {
            first_name: '',
            last_name: ''
          },
          errors: [],
          valid: false
        }
      });
      const action = {
        type: USERS_FIELD_UPDATED,
        payload: {
          name: 'first_name',
          value: 'John'
        }
      };
      usersUpdateValidationLogic.validate({ getState, action },
                                          allow, reject);
    });

    it('should reject with action USERS_FIELD_INVALID and 1 errors', () => {
      expect(reject.calls.length).toBe(1);
      expect(reject.calls[0].arguments[0].type).toBe('USERS_FIELD_INVALID');
      expect(reject.calls[0].arguments[0].payload.errors.length).toBe(1);
    });
  });

  describe('populate last, first empty', () => {
    let allow;
    let reject;
    beforeEach((done) => {
      reject = expect.createSpy().andCall(() => done());
      allow = (act) => done(act); // call done as an error
      const getState = () => ({
        users: {
          fields: {
            first_name: '',
            last_name: ''
          },
          errors: [],
          valid: false
        }
      });
      const action = {
        type: USERS_FIELD_UPDATED,
        payload: {
          name: 'last_name',
          value: 'Smith'
        }
      };
      usersUpdateValidationLogic.validate({ getState, action },
                                          allow, reject);
    });

    it('should reject with action USERS_FIELD_INVALID and 1 errors', () => {
      expect(reject.calls.length).toBe(1);
      expect(reject.calls[0].arguments[0].type).toBe('USERS_FIELD_INVALID');
      expect(reject.calls[0].arguments[0].payload.errors.length).toBe(1);
    });
  });

  describe('populate both', () => {
    let allow;
    let reject;
    beforeEach((done) => {
      allow = expect.createSpy().andCall(() => done());
      reject = (act) => done(act); // call done as an error
      const getState = () => ({
        users: {
          fields: {
            first_name: 'John',
            last_name: ''
          },
          errors: [],
          valid: false
        }
      });
      const action = {
        type: USERS_FIELD_UPDATED,
        payload: {
          name: 'last_name',
          value: 'Smith'
        }
      };
      usersUpdateValidationLogic.validate({ getState, action },
                                          allow, reject);
    });

    it('should allow action USERS_FIELD_UPDATED', () => {
      expect(allow.calls.length).toBe(1);
      expect(allow.calls[0].arguments[0].type).toBe('USERS_FIELD_UPDATED');
    });
  });

});

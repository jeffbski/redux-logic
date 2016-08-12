
import expect from 'expect';
import { TIMER_START, TIMER_START_ERROR,
         timerStart } from '../src/timer/actions';
import { timerStartLogic } from '../src/timer/logic';

describe('timerStartLogic', () => {
  describe('initial state, timerStart.validate', () => {
    let allow;
    let reject;
    beforeEach((done) => {
      const getState = () => ({
        timer: {
          value: 10,
          status: 'stopped'
        }
      });
      const action = timerStart();

      allow = expect.createSpy().andCall(() => done());
      reject = (action) => done(action); // pass as error to done
      timerStartLogic.validate({ getState, action }, allow, reject);
    });

    it('should have called allow with the action', () => {
      expect(allow.calls.length).toBe(1);
      expect(allow.calls[0].arguments[0]).toEqual({
        type: 'TIMER_START'
      });
    });
  });

  describe('10, running, timerStart.validate', () => {
    let allow;
    let reject;
    let dispatch;
    beforeEach((done) => {
      const getState = () => ({
        timer: {
          value: 10,
          status: 'started'
        }
      });
      const action = timerStart();

      allow = (action) => done(action); // pass as error to done
      reject = expect.createSpy().andCall(() => done());
      timerStartLogic.validate({ getState, action }, allow, reject);
    });

    it('should have called reject with undefined', () => {
      expect(reject.calls.length).toBe(1);
      expect(reject.calls[0].arguments[0]).toBe(undefined);
    });
  });

  describe('0, stopped, timerStart.validate', () => {
    let allow;
    let reject;
    let dispatch;
    beforeEach((done) => {
      const getState = () => ({
        timer: {
          value: 0,
          status: 'stopped'
        }
      });
      const action = timerStart();

      allow = (action) => done(action); // pass as error to done
      reject = expect.createSpy().andCall(() => done());
      timerStartLogic.validate({ getState, action }, allow, reject);
    });

    it('should have called reject with timerStartError action', () => {
      expect(reject.calls.length).toBe(1);
      expect(reject.calls[0].arguments[0].type).toBe(TIMER_START_ERROR);
    });
  });

});

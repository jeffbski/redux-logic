import expect from 'expect';
import { NOTIFY_CREATE,
           NOTIFY_QUEUE,
           NOTIFY_REMOVE,
           NOTIFY_DISPLAY_QUEUED,
           notifyCreate,
           notifyQueue,
           notifyRemove,
           notifyDisplayQueued  } from '../src/notify/actions';
import {   MAX_DISPLAY, DISPLAY_TIME,
           notifyCreateLogic, notifyRemoveLogic, notifyQueuedLogic,
           notifyDisplayQueuedLogic } from '../src/notify/logic';


describe('notifyCreateLogic', () => {
  describe('empty current, notifyCreate(), validate', () => {
    let action;
    let allow;
    let reject;
    beforeEach((done) => {
      const getState = () => ({
        notify: {
          messages: [],
          queue: []
        }
      });
      action = notifyCreate();

      allow = expect.createSpy().andCall(() => done());
      reject = (action) => done(action); // pass as error to done
      notifyCreateLogic.validate({ getState, action }, allow, reject);
    });

    it('should have called allow with the action', () => {
      expect(allow.calls.length).toBe(1);
      expect(allow.calls[0].arguments[0]).toEqual(action);
    });
  });

  describe('current = max-1, no queue, notifyCreate(), validate', () => {
    let action;
    let allow;
    let reject;
    beforeEach((done) => {
      const getState = () => ({
        notify: {
          messages: (new Array(MAX_DISPLAY - 1)).map((x, idx) => idx),
          queue: []
        }
      });

      action = notifyCreate();

      allow = expect.createSpy().andCall(() => done());
      reject = (action) => done(action); // pass as error to done
      notifyCreateLogic.validate({ getState, action }, allow, reject);
    });

    it('should have called allow with the action', () => {
      expect(allow.calls.length).toBe(1);
      expect(allow.calls[0].arguments[0]).toEqual(action);
    });
  });

  describe('full current, notifyCreate(), validate', () => {
    let action;
    let allow;
    let reject;
    beforeEach((done) => {
      const getState = () => ({
        notify: {
          messages: (new Array(MAX_DISPLAY)).map((x, idx) => idx),
          queue: []
        }
      });

      action = notifyCreate();

      allow = (action) => done(action); // pass as an error
      reject = expect.createSpy().andCall(() => done());
      notifyCreateLogic.validate({ getState, action }, allow, reject);
    });

    it('should have called reject with the queue action', () => {
      expect(reject.calls.length).toBe(1);
      expect(reject.calls[0].arguments[0]).toEqual(notifyQueue(action.payload));
    });
  });

  describe('empty current but queue, notifyCreate(), validate', () => {
    let action;
    let allow;
    let reject;
    beforeEach((done) => {
      const getState = () => ({
        notify: {
          messages: [],
          queue: [1]
        }
      });

      action = notifyCreate();

      allow = (action) => done(action); // pass as an error
      reject = expect.createSpy().andCall(() => done());
      notifyCreateLogic.validate({ getState, action }, allow, reject);
    });

    it('should have called reject with the queue action', () => {
      expect(reject.calls.length).toBe(1);
      expect(reject.calls[0].arguments[0]).toEqual(notifyQueue(action.payload));
    });
  });


});

import expect from 'expect';
import { createLogic } from '../src/index';

describe('createLogic', () => {
  describe('createLogic({})', () => {
    it('throws type is required error', () => {
      expect(() => {
        createLogic({});
      }).toThrow(/type.*required/);
    });
  });
});

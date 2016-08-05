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

  describe('latest and debounce)', () => {
    it('throws cannot use both error', () => {
      expect(() => {
        createLogic({
          type: 'FOO',
          latest: true,
          debounce: 10
        });
      }).toThrow('cannot use both');
    });
  });

  describe('latest and throttle)', () => {
    it('throws cannot use both error', () => {
      expect(() => {
        createLogic({
          type: 'FOO',
          latest: true,
          throttle: 10
        });
      }).toThrow('cannot use both');
    });
  });

  describe('name given fn', () => {
    it('converts name to fn.toString()', () => {
      const fn = () => {};
      fn.toString = () => 'myFn';
      const logic = createLogic({
        name: fn,
        type: 'FOO'
      });
      expect(logic.name).toBe('myFn');
    });
  });

  describe('type given fn', () => {
    it('converts type to fn.toString()', () => {
      const fn = () => {};
      fn.toString = () => 'myType';
      const logic = createLogic({
        type: fn
      });
      expect(logic.type).toBe('myType');
    });
  });

  describe('type given array of fns', () => {
    it('converts type to arr of fn.toString()', () => {
      const fn = () => {};
      fn.toString = () => 'myType';
      const fn2 = () => {};
      fn2.toString = () => 'myType2';
      const logic = createLogic({
        type: [fn, fn2]
      });
      expect(logic.type).toEqual(['myType', 'myType2']);
    });
  });
});

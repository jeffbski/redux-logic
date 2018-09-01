import expect from 'expect-legacy';
import { confirmProps, stringifyType } from '../src/utils';


describe('confirmProps', () => {
  it('should throw an error if a property is missing', () => {
    const obj = {
      a: 1,
      G: 10,
      H: 11
    };
    const verify = () => {
      confirmProps(obj, ['a', 'b', 'c'], 'Foo');
    };
    expect(verify).toThrow('missing Foo property: b');
  });

  it('should not throw any error if all properties are found', () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: 4
    };
    const verify = () => {
      confirmProps(obj, ['a', 'b', 'c'], 'Foo');
    };
    expect(verify).toNotThrow();
  });

  it('should throw error if a prop is missing even if objName is omitted', () => {
    const obj = {
      a: 1,
      G: 10,
      H: 11
    };
    const verify = () => {
      confirmProps(obj, ['a', 'b', 'c']);
    };
    expect(verify).toThrow('missing  property: b');
  });

});

describe('stringifyType', () => {
  it('should stringify a single type of string|symbol|regex', () => {
    [
      ['FOO', 'FOO'],
      [Symbol('BAR'), 'Symbol(BAR)'],
      [/CAT/, '/CAT/']
    ].forEach(([type, string]) => {
      expect(stringifyType(type)).toEqual(string);
    });
  });

  it('should stringify contents of an arr type of string|symbol|regex', () => {
    const type = ['FOO', Symbol('BAR'), /CAT/];
    const string = ['FOO', 'Symbol(BAR)', '/CAT/'];
    expect(stringifyType(type)).toEqual(string);
  });
});

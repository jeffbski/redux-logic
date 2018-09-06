import expect from 'expect-legacy';
import { stringifyType } from '../src/utils';

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

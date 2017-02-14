import expect from 'expect';
import { confirmProps } from '../src/utils';


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

import symbolObservable from 'symbol-observable';

// eslint-disable-next-line import/prefer-default-export
export function confirmProps(obj, arrProps, objName = '') {
  arrProps.forEach(x => {
    if (!obj[x]) {
      throw new Error(`missing ${objName} property: ${x} - need import?`);
    }
  });
}

// Symbols and Arrays containing Symbols cannot be interpolated in template strings,
// they must be explicitly converted with toString()
// eslint-disable-next-line import/prefer-default-export
export function stringifyType(type) {
  return Array.isArray(type) ?
         type.map(type => type.toString()) :
         type.toString();
}


export function isObservable(input) {
  return input && typeof input[symbolObservable] === 'function';
}

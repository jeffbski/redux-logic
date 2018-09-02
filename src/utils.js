// Symbols and Arrays containing Symbols cannot be interpolated in template strings,
// they must be explicitly converted with toString()
// eslint-disable-next-line import/prefer-default-export
export function stringifyType(type) {
  return Array.isArray(type) ?
         type.map(type => type.toString()) :
         type.toString();
}

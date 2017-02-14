
// eslint-disable-next-line import/prefer-default-export
export function confirmProps(obj, arrProps, objName = '') {
  arrProps.forEach(x => {
    if (!obj[x]) {
      throw new Error(`missing ${objName} property: ${x} - need import?`);
    }
  });
}

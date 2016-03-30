export function extend() {
  return Object.assign(...[{}].concat(Array.prototype.slice.call(arguments)));
}

export function replaceAtIndex(array, index, value) {
  return array.slice(0, index).concat([value]).concat(array.slice(index + 1));
}

export function capitalize(string) {
  return string && string.charAt(0).toUpperCase() + string.slice(1);
}

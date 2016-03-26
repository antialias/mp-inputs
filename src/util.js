export function extend() {
  return Object.assign.apply(null, [{}].concat(Array.prototype.slice.call(arguments)));
}

export function capitalize(string) {
  return string && string.charAt(0).toUpperCase() + string.slice(1);
}

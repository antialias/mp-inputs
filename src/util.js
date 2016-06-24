// IRB-specific utils

export * from 'mixpanel-common/build/util';
export * from 'mixpanel-common/build/report/util';

export function getTextWidth(text, font) {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
  let context = canvas.getContext('2d');
  context.font = font;
  return context.measureText(text).width;
}

// TODO: Move to mixpanel-common utils
// Compare data likeness of two different objects. Does not handle circular references, functions, or regex.
// Sourced from: http://stackoverflow.com/a/16788517
export function isEqual(x, y) {
  if (x === null || x === undefined || y === null || y === undefined) {
    return x === y;
  }
  if (x.constructor !== y.constructor) {
    return false;
  }
  if (x === y || x.valueOf() === y.valueOf()) {
    return true;
  }
  if (Array.isArray(x) && x.length !== y.length) {
    return false;
  }

  // if they are dates, they must have had equal valueOf
  if (x instanceof Date || y instanceof Date) {
    return false;
  }

  // if they are strictly equal, they both need to be objects
  if (!(x instanceof Object) || !(y instanceof Object)) {
    return false;
  }

  // recursive object equality check
  const p = Object.keys(x);
  return Object.keys(y).every((idx) => p.indexOf(idx) !== -1) && p.every((idx) => isEqual(x[idx], y[idx]));
}

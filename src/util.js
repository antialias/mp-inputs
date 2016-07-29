// IRB-specific utils
import { nestedObjectDepth, objectFromPairs } from 'mixpanel-common/util';

export * from 'mixpanel-common/util';
export * from 'mixpanel-common/report/util';

export function getTextWidth(text, font) {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
  let context = canvas.getContext('2d');
  context.font = font;
  return context.measureText(text).width;
}

// TODO(chi): move to mixpanel-common
export function mapObjectKeys(obj, callback) {
  const newObj = {};

  Object.keys(obj).forEach(key => {
    newObj[key] = callback(obj[key]);
  });

  return newObj;
}

function _intoObject(obj, filter, depth) {
  Object.keys(obj).forEach(key => {
    if (nestedObjectDepth(obj) === depth) {
      if (!filter(key)) {
        delete obj[key];
      }
    } else if (typeof obj[key] === 'object') {
      _intoObject(obj[key], filter, depth);
    }
  });
}

export function filterObjectAtDepth(obj, filter, depth=1) {
  const newObject = JSON.parse(JSON.stringify(obj));
  _intoObject(newObject, filter, depth);
  return newObject;
}

/**
 * Compare data likeness of two different objects. Does not handle circular references, functions, or regex.
 * Sourced from: http://stackoverflow.com/a/16788517
 */
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

 /**
  * Combine nested objected into one object of keys and the sum of their numeric values
  * @example
  * combineNestedObjKeys({
  *   first: {foo: 1, bar:2},
  *   second: {foo: 4, bar:1, tab: 2},
  * });
  * // {foo: 5, bar: 3, tab: 2}
  */
export function combineNestedObjKeys(obj, accum={}) {
  if (Object.values(obj).some(k => typeof k == 'number')) {
    Object.keys(obj).forEach(k=> accum[k] = accum[k] ? accum[k] + obj[k] : obj[k]);
  } else {
    Object.keys(obj).map(key => combineNestedObjKeys(obj[key], accum));
  }
  return accum;
}

/**
 * Sum the leaf values of a nested object,
 * constructing a new object with depth 1 less than the original
 */
export function nestedObjectSum(obj) {
  const sum = Object.values(obj).reduce((accum, val) => accum + val, 0);

  if (typeof sum === 'number') {
    return sum;
  } else {
    return objectFromPairs(Object.keys(obj).map(key => {
      return [key, nestedObjectSum(obj[key])];
    }));
  }
}

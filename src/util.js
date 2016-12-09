// IRB-specific utils
import cloneDeep from 'lodash/cloneDeep';
import { nestedObjectDepth, objectFromPairs } from 'mixpanel-common/util';

export * from 'mixpanel-common/util';
export * from 'mixpanel-common/report/util';


const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_DAY = MS_IN_HOUR * 24;
export const MS_BY_UNIT = {
  hour: MS_IN_HOUR,
  day: MS_IN_DAY,
  week: MS_IN_DAY * 7,
  month: MS_IN_DAY * 30,
  quarter: MS_IN_DAY * 90,
  year: MS_IN_DAY * 365,
};

export function getTextWidth(text, font) {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement(`canvas`));
  let context = canvas.getContext(`2d`);
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

function _filterIntoObject(obj, filter, parentKeys=[]) {
  const depth = nestedObjectDepth(obj);
  Object.keys(obj).forEach(key => {
    if (!filter(key, depth, parentKeys)) {
      delete obj[key];
    }
  });
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === `object`) {
      _filterIntoObject(obj[key], filter, parentKeys.concat(key));
      if (!Object.keys(obj[key]).length) {
        delete obj[key];
      }
    }
  });
}

export function filterObject(obj, filter) {
  const newObject = cloneDeep(obj);
  _filterIntoObject(newObject, filter);
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
  return Object.keys(y).every(idx => p.indexOf(idx) !== -1) && p.every(idx => isEqual(x[idx], y[idx]));
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
  if (Object.values(obj).some(k => typeof k === `number`)) {
    Object.keys(obj).forEach(k=> accum[k] = accum[k] ? accum[k] + obj[k] : obj[k]);
  } else {
    Object.keys(obj).map(key => combineNestedObjKeys(obj[key], accum));
  }
  return accum;
}

/**
 * Sum the leaf values of a nested object, but filter out those whose value is 0.
 * constructing a new object with depth 1 less than the original
 */
export function nestedObjectSum(obj) {
  const sum = Object.values(obj).reduce((accum, val) => accum + val, 0);

  if (typeof sum === `number`) {
    return sum;
  } else {
    return objectFromPairs(Object.keys(obj)
      .map(key => [key, nestedObjectSum(obj[key])])
      .filter(key => key[1] !== 0));
  }
}

/**
 * Do a rolling sum of the leaf values of a nested object, in the order of their keys (which are
 * dates).
 * @example
 * nestedObjectCumulative({
 *   US: {'2016-06-01': 2, '2016-06-02': 7, '2016-06-03': 9},
 *   UK: {'2016-05-02': 5, '2016-05-02': 8, '2016-05-03': 6},
 * });
 * // {
 * //   US: {'2016-06-01': 2, '2016-06-02': 9, '2016-06-03': 20},
 * //   UK: {'2016-05-02': 5, '2016-05-02': 13, '2016-05-03': 19},
 * // }
 */
export function nestedObjectCumulative(obj) {
  if (Object.values(obj).every(value => typeof value === `number`)) {
    return Object.keys(obj).sort().reduce((accum, key) => {
      const reversedKeys = Object.keys(accum).sort().reverse();
      accum[key] = (reversedKeys.length ? accum[reversedKeys[0]] : 0) + obj[key];
      return accum;
    }, {});
  } else {
    return mapObjectKeys(obj, value => nestedObjectCumulative(value));
  }
}

/**
 * Do a rolling average of the leaf values of a nested object, in the order of their keys (which are
 * dates)
 * @example
 * nestedObjectRolling({
 *   US: {'2016-06-01': 8, '2016-06-02': 2, '2016-06-03': 2, '2016-06-04': 8, '2016-06-05': 4},
 *   UK: {'2016-05-02': 6, '2016-05-02': 3, '2016-05-03': 3, '2016-05-04': 12, '2016-05-05': 6},
 * }, 7);
 * // {
 * //   US: {'2016-06-01': 8, '2016-06-02': 5, '2016-06-03': 4, '2016-06-04': 5, '2016-06-05': 6.8},
 * //   UK: {'2016-05-02': 6, '2016-05-02': 4.5, '2016-05-03': 4, '2016-05-04': 6, '2016-05-05': 6},
 * // }
 * nestedObjectRolling({
 *   US: {'2016-06-01': 8, '2016-06-02': 2, '2016-06-03': 2, '2016-06-04': 8, '2016-06-05': 4},
 *   UK: {'2016-05-02': 6, '2016-05-02': 3, '2016-05-03': 3, '2016-05-04': 12, '2016-05-05': 6},
 * }, 3);
 * // {
 * //   US: {'2016-06-01': 8, '2016-06-02': 5, '2016-06-03': 4, '2016-06-04': 4, '2016-06-05': 8},
 * //   UK: {'2016-05-02': 6, '2016-05-02': 4.5, '2016-05-03': 4, '2016-05-04': 6, '2016-05-05': 7},
 * // }
 */
export function nestedObjectRolling(obj, windowSize) {
  if (Object.values(obj).every(value => typeof value === `number`)) {
    let found = false;
    const window = [];
    let sum = 0;
    const newObj = {};
    Object.keys(obj).sort().forEach(key => {
      var amount = obj[key];
      if (!found && amount) {
        found = true;
      }

      if (found) {
        if (window.length === windowSize) {
          sum -= window[0];
          window.shift();
        }
        window.push(amount);
        sum += amount;
        amount = sum / window.length;
      }

      newObj[key] = amount;
    });
    return newObj;
  } else {
    return mapObjectKeys(obj, value => nestedObjectRolling(value, windowSize));
  }
}

function _callbackIntoObject(obj, callback) {
  const depth = nestedObjectDepth(obj);
  Object.keys(obj).forEach(key => callback(key, obj, depth));
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === `object`) {
      _callbackIntoObject(obj[key], callback);
    }
  });
}

export function uniqueObjKeysAtDepth(obj, depth) {
  const keys = new Set();
  _callbackIntoObject(obj, (value, parentObj, d) => {
    if (d === depth) {
      keys.add(value);
    }
  });
  return Array.from(keys);
}

export function formatPercent(decimal, precision=2) {
  return (Math.round(decimal * Math.pow(10, precision + 2)) / Math.pow(10, precision)) + `%`;
}

/**
 * Split a string into match and non-match substrings based on finding
 * all whitespace-separated terms in a given filter string (for UI search
 * bars).
 * @param {string} str - string to search
 * @param {string} filterStr - string with filter/search terms
 * @returns {Array} list of alternating matching and non-matching substrings
 * in order of the original string; even = match, odd = no match
 * @example
 * stringFilterMatches('my example string', 'ex my');
 * // ['my', ' ', 'ex', 'ample string']
 */
export function stringFilterMatches(str, filterStr) {
  // ensure there's a non-empty filter
  filterStr = filterStr && filterStr.trim();
  if (!filterStr) {
    return [``, str];
  }

  // prepare string and filter for search conditions
  const matchStr = str.toLowerCase();
  const searchTerms = filterStr.toLowerCase().split(` `).filter(Boolean);

  // find all matching positions
  const matchPositions = Array(str.length).fill(false);
  for (let term of searchTerms) {
    const matchIdx = matchStr.indexOf(term);
    if (matchIdx === -1) {
      return null; // short-circuit stop for non-match
    }
    for (let mi = matchIdx; mi < matchIdx + term.length; mi++) {
      matchPositions[mi] = true;
    }
  }

  // merge into match and non-match strings
  const matches = [];
  let i = 0;
  while (i < matchPositions.length) {
    let matchStr = ``;
    let nonMatchStr = ``;

    while (i < matchPositions.length && matchPositions[i]) {
      matchStr += str[i++];
    }
    while (i < matchPositions.length && !matchPositions[i]) {
      nonMatchStr += str[i++];
    }

    matches.push(matchStr);
    matches.push(nonMatchStr);
  }

  return matches;
}

/**
 * Flatten a nested object to show all possible paths + corresponding values of that object
 * @param {string} obj - nested object to be flattened
 * @returns {object} with all nested keys seperated by spaces
 * @example
 * flattenNestedObjectToPath({'US': {'California': 1, 'New York' : 2}});
 * // {'US California': 1, 'US New York': 2}
 */
export function flattenNestedObjectToPath(obj, options={}, parentKeys=[], results=null) {
  results = results || {values: {}, paths: {}};
  Object.keys(obj).forEach(key => {
    const newParentKey = parentKeys.concat(key);
    if (typeof obj[key] === `object`) {
      results = flattenNestedObjectToPath(obj[key], options, newParentKey, results);
    } else {
      const resultName = options.transformKeyName ? options.transformKeyName(newParentKey) : newParentKey.join(` `);
      results.values[resultName] = obj[key];
      results.paths[resultName] = newParentKey;
      return results;
    }
  });
  return results;
}

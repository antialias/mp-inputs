// IRB-specific utils
import cloneDeep from 'lodash/cloneDeep';
import { nestedObjectDepth, objectFromPairs } from 'mixpanel-common/util';
import moment from 'moment';

import { ShowClause } from '../models/clause';

export * from 'mixpanel-common/report/util';
export * from 'mixpanel-common/util';
export * from 'mixpanel-common/util/string';

export { getLearnStep, learnClasses, transitionLearn } from './learn';

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

export function formatDateISO(date) {
  return moment(date).format().slice(0, 10);
}

export function formatDateDisplay(date) {
  return moment(date).format(`MMM D, YYYY`);
}

export function parseDate(date, {startOfDay=false, endOfDay=false}={}) {
  const timestamp = Number(moment(date));

  if (isNaN(timestamp)) {
    return null;
  }

  date = new Date(timestamp);

  if (startOfDay) {
    date.setHours(0, 0, 0, 0);
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export function relativeToAbsoluteDate(relativeDateInt, unit) {
  return new Date(moment().subtract(relativeDateInt, `${unit}s`));
}

// TODO move to mixpanel-common
export function parseURLQueryParams() {
  return window.location.search.slice(1).split(`&`)
    .reduce((params, pairStr) => {
      const [k, v] = pairStr.split(`=`);
      return Object.assign(params, {[k]: v});
    }, {});
}

export function getTextWidth(text, font) {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement(`canvas`));
  let context = canvas.getContext(`2d`);
  context.font = font;
  return context.measureText(text).width;
}

export function formatResourceType(type) {
  return type === `events` ? `event` : type;
}

export function isSpecialEvent(mpEvent) {
  return [ShowClause.TOP_EVENTS.name, ShowClause.ALL_EVENTS.name].includes(mpEvent.name);
}

export function getIconForEvent(mpEvent) {
  if (isSpecialEvent(mpEvent)) {
    return `star-top-events`;
  } else if (mpEvent.is_collect_everything_event) {
    return `autotrack`;
  } else if (mpEvent.custom) {
    return `custom-events`;
  } else {
    return `event`;
  }
}

const PROPERTY_TYPE_ICON_MAP = {
  boolean:  `type-boolean`,
  datetime: `type-date`,
  list:     `type-list`,
  number:   `type-number`,
  string:   `type-text`,
};
export function getIconForPropertyType(propType) {
  return PROPERTY_TYPE_ICON_MAP[propType];
}
export function getIconForProperty(property) {
  return getIconForPropertyType(property && property.type);
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

function _callbackIntoObject(obj, callback, {minDepth=0, depthFirst=false}={}) {
  const depth = nestedObjectDepth(obj);
  const shouldContinue = depth >= minDepth;
  const objKeys = Object.keys(obj);

  if (!depthFirst) {
    objKeys.forEach(key => shouldContinue && callback(key, obj, depth));
  }
  if (shouldContinue) {
    objKeys.forEach(key => {
      if (typeof obj[key] === `object`) {
        _callbackIntoObject(obj[key], callback, {minDepth, depthFirst});
      }
    });
  }
  if (depthFirst) {
    objKeys.forEach(key => shouldContinue && callback(key, obj, depth));
  }
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

/**
  * Find all reachable notes in an object from a starting key at a depth
  * @param {Object} options
  * @param {Object} options.series - The object searched
  * @param {Object[]} options.keysToMatch - A list of keys that are considered descendents
  * @param {String} options.depth - The depth at which keysToMatch exists
  * @returns {object} returns a nested object of the matching ancestors set to true inside of
  * the depth which they were found
  * @example
  * reachableNodesOfKey({
  *   series: {'US': {'California': {'San Francisco': 2}, 'New York' : {'Buffalo': 1}}},
  *   keysToMatch: ['California'],
  *   depth: 1,
  * });
  * //{1: {'San Francisco': true}, 2: {'California': true}, 3: {'US': true}}
  */
export function reachableNodesOfKey({series={}, keysToMatch=[], depth=1}={}) {
  const REACHABLE_NODES = {[depth]: keysToMatch.reduce((obj, key) => {
    obj[key] = true;
    return obj;
  }, {})};

  const _addToFamily = (depth, key) => {
    REACHABLE_NODES[depth] = (REACHABLE_NODES[depth] || {});
    REACHABLE_NODES[depth][key] = true;
  };
  _callbackIntoObject(series, (value, objectHoldingValue, depthInSeries) => {
    if (depthInSeries > depth) {
      // create ancestor list
      const valueChilden = Object.keys(objectHoldingValue[value]);
      const keysToMatch = Object.keys(REACHABLE_NODES[depthInSeries - 1] || {});
      const objectHasMatch = keysToMatch.some(matchKey => valueChilden.includes(matchKey));
      if (objectHasMatch) {
        _addToFamily(depthInSeries, value);
      }
    } else if (depthInSeries === depth && keysToMatch.includes(value)) {
      // add descendents of matching keys
      _callbackIntoObject(objectHoldingValue[value], (childValue, _, childDepth) => {
        _addToFamily(childDepth, childValue);
      }, {minDepth: 2}); // remove time series data
    }
  }, {
    minDepth: depth,
    depthFirst: true,
  });

  return REACHABLE_NODES;
}

// Insights-specific utils
import cloneDeep from 'lodash/cloneDeep';
import {
  capitalize,
  nestedObjectDepth,
  objectFromPairs,
} from 'mixpanel-common/util';
import moment from 'moment';

import {SOURCE_DETAILS} from '../models/constants';
import {ShowClause} from '../models/clause';

// TODO(mack): Explicitly import what's needed and remove * imports
export * from 'mixpanel-common/report/util';
export {
  getIconForEvent,
  getIconForPropertyType,
  getDefinitionForEvent,
  renameEvent,
  renameProperty,
  renamePropertyValue,
} from 'mixpanel-common/report/util';
export * from 'mixpanel-common/util';
export * from 'mixpanel-common/util/string';
export * from 'mixpanel-common/util/date';

export {
  isIncompleteInterval,
  transposeColsToRows,
} from './chart';

export {
  getLearnStep,
  learnClasses,
  transitionLearn,
  finishLearn,
} from './learn';

export {
  filterToArbSelectorString,
  isFilterValid,
  toArbSelectorPropertyToken,
} from './queries';

export {
  upsellOptions,
} from './upsell';


export const KEY_CODES = {
  tab: 9,
  enter: 13,
  upArrow: 38,
  downArrow: 40,
};

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

export function formatSource(source, labelType) {
  return SOURCE_DETAILS[source][labelType];
}

export function formatEventName(mpEvent) {
  return mpEvent.custom ? `$custom_event:${mpEvent.id}` : mpEvent.name;
}

export function isSpecialEvent(mpEvent) {
  return [ShowClause.TOP_EVENTS.name, ShowClause.ALL_EVENTS.name].includes(mpEvent.name);
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
    if (typeof obj[key] === `object` && obj[key] !== null) {
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
 * Turn a nested object into a list of "path" arrays,
 * which represent all of its key combinations.
 * Example:
 *   {                     [['a', 'x', 1],
 *     a: {x: 1, y: 2}, =>  ['a', 'y', 2],
 *     b: {x: 1, y: 2},     ['b', 'x', 1],
 *   }                      ['b', 'y', 2]]
 * The depth param controls how deep into the object the
 * transformation is applied. Sub-objects of the given
 * depth will be placed at the last index of the path.
 * Example (depth=1):
 *   {                     [['a', {x: 1}],
 *     a: {x: 1, y: 2}, =>  ['a', {y: 2}],
 *     b: {x: 1, y: 2},     ['b', {x: 1}],
 *   }                      ['b', {y: 2}]]
 */
export function nestedObjectPaths(obj, depth=0) {
  let paths = [];

  function _getObjectPaths(obj, path=[]) {
    if (nestedObjectDepth(obj) > depth) {
      Object.keys(obj).forEach(key => _getObjectPaths(obj[key], [...path, key]));
    } else {
      paths.push([...path, obj]);
    }
  }

  _getObjectPaths(obj);

  return paths;
}

/**
 * Flatten a nested object to show all possible paths + corresponding values of that object
 * @param {string} obj - nested object to be flattened
 * @returns {object} with all nested keys seperated by spaces
 * @example
 * flattenNestedObjectToPath({'US': {'California': 1, 'New York' : 2}});
 * // {
 * //   values: {'US California': 1, 'US New York': 2},
 * //   paths: {{'US California': ['US', 'California'], 'US New York': ['US', 'New York']},
 * // }
 */
export function flattenNestedObjectToPath(series, {flattenValues=false, formatHeader=null}={}) {
  const paths = {};
  let values = nestedObjectPaths(series, 1).reduce((values, headers) => {
    const results = headers.pop();
    const key = formatHeader ? formatHeader(headers) : headers.join(` `);
    paths[key] = headers;
    return Object.assign(values, {[key]: results});
  }, {});
  if (flattenValues) {
    values = nestedObjectSum(values);
  }
  return {paths, values};
}

/**
  * Find all reachable nodes in an object from a starting key at a depth
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

// TODO Jordan: move offsetTimestampWithDst + createBaseResults to DATE UTILS in common and add tests

/**
 * Turn a project based timestamp into local time accounting for DST
 * @param {Number} timestamp - the timestamp in project time to be converted
 * @returns {Number} converted time
 * @example
 * offsetTimestampWithDst(1490140800000); // Done in PST timezone
 * // 1490166000000
 */
export function offsetTimestampWithDst(timestamp) {
  // If we are currently in DST and the timestamp in local time is NOT in DST add an hour to offset it.
  let date = moment(timestamp);
  if (moment().isDST() && !date.isDST()) {
    date.add(1, `hours`);
  }
  return date.valueOf();
}

/**
 * Provide base results object for all timestamps between toDate and fromDate. from / to falls back to the results min and max.
 * @param {Array} results - jql result object to get dates from. This assumes that the last item in the result is the timestamp/
 * @param {Number} [toDate] - starting date for zeroing range. only applies if unit is provided.
 * @param {Number} [fromDate] - ending date for zeroing range. only applies if unit is provided.
 * @param {Boolean} [timestampIsSeconds] - Converts result timestamps to MS by multiplying 1000 if this is set to true.
 * @param {String} [unit] - if unit is provided dates for  fromDate -> toDate are included in the results
 * @returns {object} with all nested keys seperated by spaces
 * @example
 * flattenNestedObjectToPath([
    {"key":["Run query",1489968000000],"value":922},
    {"key":["Run query",1490140800000],"value":505}
  ], {toDate=1490140800000, fromDate=1489968000000, timestampIsSeconds=false, unit='day'});
 * // {
 * //   1489993200000: 0,
 * //   1490079600000: 0,
 * //   1490166000000: 0,
 * // }
 */
export function createBaseResults(results, {toDate=null, fromDate=null, timestampIsSeconds=false, unit=null}={}) {
  let sortedTimestamps = results
    .map(result => result.key[result.key.length - 1])
    .filter(timestamp => timestamp !== null && Number.isInteger(Number(timestamp)))
    .map(timestamp => timestampIsSeconds ? Number(timestamp) * 1000 : Number(timestamp))
    .sort();

  const minTimestamp = sortedTimestamps[0];
  const maxTimestamp = sortedTimestamps[sortedTimestamps.length - 1];

  const timestampsForRange = [];
  if (unit) {
    const fromMoment = moment(fromDate || minTimestamp);
    const toMoment = moment(toDate || maxTimestamp);

    for (let cursor = fromMoment; cursor.isBefore(toMoment); cursor.add(1, `${unit}s`)) {
      timestampsForRange.push(cursor.valueOf());
    }
  }

  return sortedTimestamps
    .concat(timestampsForRange)
    .reduce((obj, timestamp) => Object.assign(obj, {[timestamp]: 0}), {});
}

/**
 * Returns false if `val` is undefined, null or NaN, otherwise true
 * NOTE: Returns true for 0 and ''(empty string)
 * @param val {any}
 * @returns {boolean}
 */
export function hasDefinedValue(val) {
  if (typeof val === `number`) {
    return !isNaN(val);
  }
  return (val !== undefined && val !== null);
}

import {
  numDateAlphaComparator,
  nestedObjectDepth,
  mapValues,
  sum,
} from 'mixpanel-common/util';

import {
  Cache,
} from 'mixpanel-common/util/cache';
import {
  identity,
  lexicalCompose,
} from 'mixpanel-common/util/function';

import { localizedDate } from 'mixpanel-common/util/date';

const CHART_OPTIONS = {
  bar: {
    standard: `Bar`,
    stacked: `Stacked bar`,
  },
  line: {
    standard: `Line`,
    stacked: `Stacked line`,
  },
  table: {
    standard: `Table`,
  },
};

export function formattedChartName(type, style) {
  return CHART_OPTIONS[type][style];
}

export function styleChoicesForChartType(type) {
  return Object.keys(CHART_OPTIONS[type]);
}

function lowercase(item) {
  return item && item.toLowerCase ? item.toLowerCase() : item;
}

const parseDateCache = new Cache();
export function cacheParsedDate(dateString, timestampInMS) {
  parseDateCache.add(lowercase(dateString), timestampInMS);
}

/**
 * Construct a sort comparator function that will attempt to parse and sort header
 * values as number, date, or string (converts string values to lowercase).
 * Treats date strings like "Jun 10 - Jun 16" as "Jun 10".
 */
export function sortComparator({order=`asc`, transform=identity}) {
  return numDateAlphaComparator({
    order: {
      base: order,
      number: order,
      date: order === `asc` ? `desc` : `asc`, // sort date properties in reverse order
    },
    transform: item => lowercase(transform(item)),
    parseDateCache,
  });
}

/**
 * Construct a sort comparator function that will attempt to parse and sort multiple header values
 * in turn as number, date, or string (converts string values to lowercase).
 * Treats date strings like "Jun 10 - Jun 16" as "Jun 10".
 */
export function multiPartSortComparator(parts, {order=`asc`, transform=identity}={}) {
  return lexicalCompose(...parts.map((part, i) =>
    sortComparator({order, transform: item => transform(item)[i]})
  ));
}

/**
 * Transpose a 2-dimensional array:
 * [[1, 2, 3],    [[1, 4],
 *  [4, 5, 6]] =>  [2, 5],
 *                 [3, 6]]
 */
export function transpose(matrix) {
  if (matrix && matrix.length) {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
  }
  return matrix;
}

/**
 * Given an array of values and a start index,
 * count the number of the value at the start index repeats:
 * countRun(['a', 'a', 'b', 'b', 'b', 'c'], 2) => 3
 */
export function countRun(row, start) {
  let i;
  for (i = start; row[i] === row[start]; i++);
  return i - start;
}

/**
 * Get the max leaf value of a nested object
 */
export function nestedObjectMax(obj) {
  if (typeof obj === `number`) { return obj; }
  return Math.max(0, Math.max(...Object.keys(obj).map(key => nestedObjectMax(obj[key]))));
}

export function stackedNestedObjectMax(obj) {
  if (Object.values(obj).some(k => typeof k === `number`)) {
    return Object.values(obj).reduce((a, b) => a + b, 0);
  }
  return Math.max(0, Math.max(...Object.keys(obj).map(key => stackedNestedObjectMax(obj[key]))));
}

/**
 * Helper for nestedObjectToTableData.
 * Converts data object into nested array structure (with subgroup sums),
 * which can subsequently be sorted.
 */
function nestedObjectToArrayWithSums(obj, depth) {
  let arr = Object.keys(obj).map(k => {
    let child, currentSum;
    if (depth > 2) {
      child = nestedObjectToArrayWithSums(obj[k], depth - 1);
      currentSum = sum(child.map(c => c[0].sum));
    } else if (depth === 1) {
      child = {value: obj[k]};
      currentSum = child.value;
    } else {
      child = obj[k];
      currentSum = sum(Object.values(child));
    }
    return [{value: k, sum: currentSum}, child];
  });
  return arr;
}

/**
 * Helper for nestedObjectToTableData.
 * Recursively turns nested array table structure into row-by-row array.
 * @param {array} arr - nested array table structure
 * @param {number} depth - column depth of table
 * @param {boolean} allowNullHeaders - whether to turn repeated headers in
 * contiguous rows into null (for coalesced table display)
 */
function expandTableHeaderRows(arr, depth, allowNullHeaders=true) {
  if (depth <= 2) {
    return arr;
  }
  return arr.reduce((expanded, row) => {
    const expandedChild = expandTableHeaderRows(row[1], depth - 1, allowNullHeaders);
    const newRows = expandedChild.map((childRow, cri) => [
      (cri && allowNullHeaders) ? null : row[0], ...childRow,
    ]);
    if (allowNullHeaders) {
      newRows[0][0].rowSpan = newRows.length;
    }
    return(expanded.concat(newRows));
  }, []);
}

/**
 * Helper for nestedObjectToTableData.
 * Sorts table rows according to header names, maintaining header groupings.
 */
function sortTableColumns(arr, colSortAttrs) {
  if (colSortAttrs.length > 2) { // handle special table layout cases for 1 or 2 columns
    arr = arr.map(child => [child[0], sortTableColumns(child[1], colSortAttrs.slice(1))]);
  }
  return arr.sort(sortComparator({
    order: colSortAttrs[0].sortOrder,
    transform: item => item[0].value,
  }));
}

/**
 * Format rows for nested table display. Calculates rowspans and intermediate sums, and sorts
 * according to given config. See tests for detailed examples.
 *
 * @example
 * nestedObjectToTableData({US: {llama: 5, aardvark: 8}}, {
 *   sortBy: 'column',
 *   colSortAttrs: [{sortBy: 'label', sortOrder: 'asc'}],
 * });
 * // [
 * //   [{value: 'US', sum: 13}, {llama: 5, aardvark: 8}],
 * // ]
 */
export function nestedObjectToTableData(obj, sortConfig) {
  const objDepth = nestedObjectDepth(obj);
  let arr = nestedObjectToArrayWithSums(obj, objDepth);

  switch(sortConfig.sortBy) {
    case `column`:
      arr = sortTableColumns(arr, sortConfig.colSortAttrs);
      arr = expandTableHeaderRows(arr, objDepth);
      break;
    case `value`:
      arr = expandTableHeaderRows(arr, objDepth, false)
        .sort(sortComparator({
          order: sortConfig.sortOrder,
          transform: item => item[item.length - 1][sortConfig.sortColumn] || 0,
        }));
      break;
  }
  return arr;
}

function _headerRowSpan(obj) {
  if (!obj.children || !obj.children[0].children) {
    return 1;
  } else if (obj.children[0].children[0].children) {
    return sum(obj.children.map(_headerRowSpan));
  } else {
    return obj.children.length;
  }
}

function nestedArrayToBarChartData(arr) {
  if (!(!!arr.length && arr[0].children)) {

    // leaf, entire list in one table cell
    return [[arr.map(n => n.label), arr.map(n => n.value)]];

  } else {

    const penultimate = !(!!arr[0].children.length && arr[0].children[0].children);
    if (penultimate) {

      return arr.map(n => [{value: n.label, sum: n.value}, ...nestedArrayToBarChartData(n.children)[0]]);

    } else {

      // expand nested children beyond the first to extra top-level rows with null headers
      const ret = [];
      for (const entry of arr) {
        let rowCount = 0, header;
        for (const child of entry.children) {
          const childData = nestedArrayToBarChartData([child]);
          for (const row of childData) {
            if (!rowCount++) {
              let rowSpan = _headerRowSpan(entry);
              header = {
                value: entry.label,
                sum: entry.value,
              };
              if (rowSpan > 1) {
                header.rowSpan = rowSpan;
              }
            } else {
              header = null;
            }
            ret.push([header, ...row]);
          }
        }
      }
      return ret;
    }
  }
}

/**
 * Internal util supporting 'sort by final value' functionality of
 * nestedObjectToNestedArray. Expands nested subgroups into new rows.
 *
 * @example
 * flattenNestedObjectToArray({US: {llama: 5, aardvark: 8}});
 * // [
 * //   {label: 'US', value: 5, children: [{label: 'llama', value: 5}]},
 * //   {label: 'US', value: 8, children: [{label: 'aardvark', value: 8}]},
 * // ]
 */
function flattenNestedObjectToArray(obj) {
  if (typeof obj === `number`) {
    return obj;
  } else {
    return Object.keys(obj)
      .map(label => {
        let entry;
        const value = obj[label];
        if (typeof value === `object`) {
          entry = flattenNestedObjectToArray(value).map(child => ({
            label,
            children: [child],
            value: child.value,
          }));
        } else {
          entry = {label, value};
        }
        return entry;
      })
      .reduce((a, b) => a.concat(b), []);
  }
}

/**
 * Helper for nestedObjectToBarChartData. Turns a nested object with numeric leaves
 * into a nested array with rows sorted according to given multi-level config.
 * See tests for examples.
 */
export function nestedObjectToNestedArray(obj, sortConfig) {
  let arr;
  switch(sortConfig.sortBy) {

    case `column`: {
      const colSortAttrs = sortConfig.colSortAttrs[0];
      arr = Object.keys(obj)
        .map(k => {
          const entry = {label: k};
          const value = obj[k];
          if (typeof value === `object`) {
            entry.children = nestedObjectToNestedArray(value, Object.assign({}, sortConfig, {
              colSortAttrs: sortConfig.colSortAttrs.slice(1),
            }));
            entry.value = entry.children.reduce((sum, n) => sum + n.value, 0);
          } else {
            entry.value = value;
          }
          return entry;
        })
        .sort(sortComparator({
          order: colSortAttrs.sortOrder,
          transform: item => item[colSortAttrs.sortBy],
        }));
      break;
    }

    case `value`:
      arr = flattenNestedObjectToArray(obj)
        .sort(sortComparator({
          order: sortConfig.sortOrder,
          transform: item => item.value,
        }));
      break;

    default:
      throw new Error(`Unknown sortBy type: ${sortConfig.sortBy}`);

  }
  return arr;
}

/**
 * Format rows for nested display. Calculates rowspans and intermediate sums, and sorts
 * according to given config. Final numeric value/key pairs become parallel arrays for
 * inclusion in a single table cell. See tests for detailed examples.
 *
 * @example
 * nestedObjectToBarChartData({US: {llama: 5, aardvark: 8}}, {
 *   sortBy: 'column',
 *   colSortAttrs: [
 *     {sortBy: 'value', sortOrder: 'asc'},
 *     {sortBy: 'value', sortOrder: 'desc'},
 *   ],
 * });
 * // [
 * //   [{value: 'US', sum: 13}, ['aardvark', 'llama'], [8, 5]],
 * // ]
 */
export function nestedObjectToBarChartData(obj, sortConfig) {
  if (typeof obj === `object` && Object.keys(obj).length) {
    return nestedArrayToBarChartData(nestedObjectToNestedArray(obj, sortConfig));
  } else {
    return [];
  }
}

// From media/js/charts/chart.js.

// TODO
// Note that this just mirrors the existing segmentation logic, which both
// requires a customized version of Highcharts and fails to account for
// incomplete data in the past (e.g., 2016-12-01 through 2017-01-01 with
// monthly time unit will show data for only one day of January but a solid
// line).

// For future reference, IMO the right way to handle this is for
// isIncomplete to take a "to" date and a unit, and determine whether that
// "to" date is at the end of a unit boundary. There's also now a duplicate
// copy in mp-common, which is where these changes should happen.

// For avoiding a customized Highcharts, we could remove the last data
// point from an incomplete segment, and create a new segment with just the
// last two data points, linked to the prior segment and with different
// styling. This works right now in line chart, but fails in stacked line
// (though of course it seems to work in stacked line in the latest
// Highcharts).

/**
  * isIncompleteInterval -- Returns true if the last time-period has not been completed
  *
  * @param {Hash} series A single series, in highcharts format
  * @param {Hash} an options hash.
  *      * (required) 'unit' interval in milliseconds
  *        OR A string describing the interval ('hour', 'day', 'week', 'month')
  *      * (required) 'utcOffset' timezone offset in minutes
  *        OR A string describing the interval ('hour', 'day', 'week', 'month')
  *      * "adjust_for_local_time" This adjusts the estimation for local time.
  * @return {Boolean} true/false
  */
export function isIncompleteInterval(data, options) {
  options = options || {};
  var unit = options.unit;
  if (data && data.length > 0 && unit !== undefined) {
    var timeInterval;
    var lastPoint = data[data.length - 1];
    var lastDate = Array.isArray(lastPoint) ? lastPoint[0] : lastPoint.x;
    var date = new Date();
    var currentDate = localizedDate({utcOffset: options.utcOffset});
    var currentInterval = (currentDate - lastDate);

    if (Number.isInteger(unit)) {
      timeInterval = unit;
    } else {
      var hour = 60 * 60 * 1000;  // milliseconds in an hour

      switch (unit.toLowerCase()) {
        case `hour`:
          timeInterval = hour;
          break;
        case `day`:
          timeInterval = 24 * hour;
          break;
        case `week`:
          timeInterval = 7 * 24 * hour;
          break;
        case `month`:
          date = new Date(currentDate); // change date to account for offset
          var start = new Date(date.getYear(), date.getMonth());
          var end = new Date(date.getYear(), date.getMonth() + 1);
          timeInterval = (end.getTime() - start.getTime());
          break;
        case `quarter`:
          var now = new Date(currentDate);
          var last = new Date(lastDate);
          var nowMonths = now.getUTCFullYear() * 12 + now.getUTCMonth();
          var lastMonths = last.getUTCFullYear() * 12 + last.getUTCMonth();
          return nowMonths - lastMonths < 3;
        case `year`:
          return new Date(currentDate).getUTCFullYear() === new Date(lastDate).getUTCFullYear();
        default:
          console.error(`Unknown interval: "${timeInterval}"`);
          return false;
      }
    }

    return currentInterval < timeInterval;
  } else {
    return false;
  }
}

/**
 * Transpose rows to columns like an extra group by clause does
 * It is assumed that series has only 2 dimensions
 * @param {string[]} headers - Names for the different series in order of group by
 * @param {any} series - object with rowNames as properties and colNames as subProperties
 * @param {string} leafHeader - e.g 'Total number of'
 * @param {boolean} addLeafHeader - Whether to append leafHeader to headers
 * @returns {{headers: string[], series: any}} - Tuple of header and series with cols transposed
 */
export function transposeColsToRows(headers, series, leafHeader, addLeafHeader=true) {
  if (headers.length !== 2) {
    throw new Error(`Expecting ${headers} to be of length 2`);
  }

  const newHeaders = addLeafHeader ? [...headers, leafHeader] : headers;
  const newSeries = mapValues(series, row => (
    mapValues(row, col => (
      {[leafHeader]: col}
    ))
  ));

  return {headers: newHeaders, series: newSeries};
}

/**
 * Applies a transformation to leaves of a nested object/array and returns the result
 * Does not modify the original
 * @param {object|array} object - object/array to be transformed
 * @param {function} transform - transform function that accepts (key, val) args and returns a [key, val] array
 * @returns {object} - a copy of the original object with leaves transformed
 */
let _hasChildren, _transformKeyVal; // predefine helpers
export function transformLeaves(object, transform) {
  if (!_hasChildren(object)) {
    return object;
  } else if (Array.isArray(object)) {
    return object.map((item, index) => {
      [index, item] = _transformKeyVal(index, item, transform);
      return item;
    });
  } else {
    return Object.assign(...Object.entries(object).map(([key, val]) => {
      [key, val] = _transformKeyVal(key, val, transform);
      return {[key]: val};
    }));
  }
}
_hasChildren = val => val && typeof val === `object` && Object.keys(val).length;
_transformKeyVal = (key, val, transform) => (
  _hasChildren(val) ? [key, transformLeaves(val, transform)] : transform(key, val)
);

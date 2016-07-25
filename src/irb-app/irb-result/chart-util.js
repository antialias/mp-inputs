import { nestedObjectDepth, sum } from 'mixpanel-common/util';

/* Transpose a 2-dimensional array:
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

/* Given an array of values and a start index,
 * count the number of the value at the start index repeats:
 * countRun(['a', 'a', 'b', 'b', 'b', 'c'], 2) => 3
 */
export function countRun(row, start) {
  let i;
  for (i = start; row[i] === row[start]; i++);
  return i - start;
}

// Get the max leaf value of a nested object
export function nestedObjectMax(obj) {
  if (typeof obj === 'number') { return obj; }
  return Math.max(0, Math.max(...Object.keys(obj).map(key => nestedObjectMax(obj[key]))));
}

export function stackedNestedObjectMax(obj) {
  if (Object.values(obj).some(k => typeof k == 'number')) {
    return Object.values(obj).reduce((a, b) => a + b, 0);
  }
  return Math.max(0, Math.max(...Object.keys(obj).map(key => stackedNestedObjectMax(obj[key]))));
}

/* Collects unique keys at a given level in a nested object:
 * Example (depth=1):
 *   {
 *     a: {x: 1, y: 2}, => ['x', 'y', 'z']
 *     b: {x: 1, z: 2},
 *   }
 */

/* Turn a nested object into a list of "path" arrays,
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

export function nestedObjectToTableData(obj, sortConfig) {
  const objDepth = nestedObjectDepth(obj);
  let arr = nestedObjectToArrayWithSums(obj, objDepth);

  switch(sortConfig.sortBy) {
    case 'column':
      arr = sortTableColumns(arr, sortConfig.colSortAttrs);
      arr = expandTableHeaderRows(arr, objDepth);
      break;
    case 'value':
      arr = expandTableHeaderRows(arr, objDepth, false);
      arr = arr.sort((a, b) => {
        [a, b] = [a, b].map(entry => entry[entry.length - 1][sortConfig.sortColumn] || 0);
        return (a > b ? 1 : (a < b ? -1 : 0)) * (sortConfig.sortOrder === 'desc' ? -1 : 1);
      });
      break;
  }
  return arr;
}

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

function sortTableColumns(arr, colSortAttrs) {
  let childSortAttrs = colSortAttrs.slice(1);
  if (childSortAttrs.length) {
    arr = arr.map(child => {
      return [child[0], sortTableColumns(child[1], childSortAttrs)];
    });
  }
  return arr
    .sort((a, b) => {
      [a, b] = [a, b].map(entry => entry[0].value);
      return (a > b ? 1 : (a < b ? -1 : 0)) * (colSortAttrs[0].sortOrder === 'desc' ? -1 : 1);
    });
}
function nestedObjectToArrayWithSums(obj, depth) {
  let arr = Object.keys(obj).map(k => {
    let child, currentSum;
    if (depth > 2) {
      child = nestedObjectToArrayWithSums(obj[k], depth - 1);
      currentSum = sum(child.map(c => c[0].sum));
    } else {
      child = obj[k];
      currentSum = sum(Object.values(child));
    }
    return [{value: k, sum: currentSum}, child];
  });
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
  if (typeof obj === 'object') {
    return nestedArrayToBarChartData(nestedObjectToNestedArray(obj, sortConfig));
  } else {
    return [];
  }
}
function nestedArrayToBarChartData(arr) {
  if (!arr[0].children) {

    // leaf, entire list in one table cell
    return [[arr.map(n => n.label), arr.map(n => n.value)]];

  } else {

    const penultimate = !arr[0].children[0].children;
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
              let rowSpan = childData.length * entry.children.length;
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
 * Helper for nestedObjectToBarChartData. Turns a nested object with numeric leaves
 * into a nested array with rows sorted according to given multi-level config.
 * See tests for examples.
 */
export function nestedObjectToNestedArray(obj, sortConfig) {
  let arr;
  switch(sortConfig.sortBy) {

    case 'column': {
      const colSortAttrs = sortConfig.colSortAttrs[0];
      arr = Object.keys(obj)
        .map(k => {
          const entry = {label: k};
          const value = obj[k];
          if (typeof value === 'object') {
            entry.children = nestedObjectToNestedArray(value, Object.assign({}, sortConfig, {
              colSortAttrs: sortConfig.colSortAttrs.slice(1),
            }));
            entry.value = entry.children.reduce((sum, n) => sum + n.value, 0);
          } else {
            entry.value = value;
          }
          return entry;
        })
        .sort(NESTED_ARRAY_SORT_FUNCS[colSortAttrs.sortBy][colSortAttrs.sortOrder]);
      break;
    }

    case 'value':
      arr = flattenNestedObjectToArray(obj)
        .sort(NESTED_ARRAY_SORT_FUNCS.value[sortConfig.sortOrder]);
      break;

    default:
      throw Error(`Unknown sortBy type: ${sortConfig.sortBy}`);

  }
  return arr;
}

// sort utils for nestedObjectToNestedArray
const NESTED_ARRAY_SORT_FUNCS = {
  label: {
    asc:  (a, b) => compareByKey(a, b, 'label'),
    desc: (a, b) => compareByKey(a, b, 'label') * -1,
  },
  value: {
    asc:  (a, b) => compareByKey(a, b, 'value'),
    desc: (a, b) => compareByKey(a, b, 'value') * -1,
  },
};
function compareByKey(a, b, key) {
  [a, b] = [a[key], b[key]];
  return a > b ? 1 : (a < b ? -1 : 0);
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
  if (typeof obj === 'number') {
    return obj;
  } else {
    return Object.keys(obj)
      .map(label => {
        let entry;
        const value = obj[label];
        if (typeof value === 'object') {
          entry = flattenNestedObjectToArray(value).map(child => ({
            label: label,
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

/* Format rows for nested table, calculating necessary rowspans
 * Example:
 *   for each row
 *   ['a', 'a', 'a', 'b', 'b'] => [{value: 'a', rowSpan: 3}, null, null, {value: 'b': rowSpan: 2}, null]
 * Won't allow a lower row to have spans that cross over changes in a higher row,
 * in order to maintain the "tree-like" structure of the original nested object.
 * Example:
 *   NO
 *     [['a', 'a', 'b', 'b'], =/=> [[a2, null,   b2, null],
 *      ['x', 'y', 'y', 'y']]       [x1,   y3, null, null]]
 *   YES
 *     [['a', 'a', 'b', 'b'], => [[a2, null, b2, null],
 *      ['x', 'y', 'y', 'y']]     [x1,   y1, y2, null]]
 */
export function nestedObjectToTableRows(obj, depth=0) {
  return transpose(transpose(nestedObjectPaths(obj, depth)).map((row, y, rows) => {
    let prevRow = y && rows[y - 1];

    return row.map((value, x) => {
      if (x && row[x - 1] === row[x] && (!prevRow || prevRow[x - 1] === prevRow[x])) {
        return null;
      } else {
        let rowSpan = countRun(row, x);

        if (prevRow) {
          rowSpan = Math.min(rowSpan, countRun(prevRow, x));
        }

        return {value, rowSpan};
      }
    });
  }));
}

function _intoObject(obj, filter, depth) {
  Object.keys(obj).forEach( key => {
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

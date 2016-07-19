import { nestedObjectDepth, objectFromPairs } from 'mixpanel-common/build/util';

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

/* Get the ideal "distance" between ticks for a given range
 * results in a value like 5, 10, 25, 50, 100, 250, 500, etc.
 */
export function getTickDistance(max, min=0, targetNumTicks=10) {
  let distance = 5;
  while ((max - min) / distance > targetNumTicks) {
    distance *= Number.isInteger(Math.log10(distance)) ? 2.5 : 2;
  }
  return distance;
}

/* Sum the leaf values of a nested object,
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

// Get the max leaf value of a nested object
export function nestedObjectMax(obj) {
  if (typeof obj === 'number') { return obj; }
  return Math.max(0, Math.max(...Object.keys(obj).map(key => nestedObjectMax(obj[key]))));
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

/**
 * nestedObjectToNestedArray - turns a nested object with numeric leaves
 * into a nested array with rows sorted according to given multi-level config.
 * See tests for examples.
 */
const NESTED_ARRAY_SORT_FUNCS = {
  deepestValue: {
    asc:  (a, b) => compareByDeepestValue(a, b),
    desc: (a, b) => compareByDeepestValue(a, b) * -1,
  },
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
function compareByDeepestValue(a, b) {
  [a, b] = [deepestValue(a), deepestValue(b)];
  return a > b ? 1 : (a < b ? -1 : 0);
}
function deepestValue(entry) {
  return typeof entry.value === 'number' ? entry.value : deepestValue(entry.value[0]);
}
function flattenNestedObjectToArray(obj) {
  if (typeof obj === 'number') {
    return obj;
  } else {
    return Object.keys(obj)
      .map(k => ({
        label: k,
        value: flattenNestedObjectToArray(obj[k]),
      }))
      .map(entry => {
        return typeof entry.value === 'number' ? entry : entry.value.map(v => ({
          label: entry.label,
          value: typeof v === 'number' ? v : [v],
        }));
      })
      .reduce((a, b) => a.concat(b), []);
  }
}
export function nestedObjectToNestedArray(obj, sortConfig) {
  let arr;
  switch(sortConfig.sortBy) {

    case 'column': {
      const colSortAttrs = sortConfig.colSortAttrs[0];
      arr = Object.keys(obj)
        .map(k => {
          const entry = {
            label: k,
            value: obj[k],
          };
          if (typeof entry.value === 'object') {
            entry.value = nestedObjectToNestedArray(entry.value, Object.assign({}, sortConfig, {
              colSortAttrs: sortConfig.colSortAttrs.slice(1),
            }));
          }
          return entry;
        })
        .sort(NESTED_ARRAY_SORT_FUNCS[colSortAttrs.sortBy][colSortAttrs.sortOrder]);
      break;
    }

    case 'value':
      arr = flattenNestedObjectToArray(obj)
        .sort(NESTED_ARRAY_SORT_FUNCS.deepestValue[sortConfig.sortOrder]);
      break;

    default:
      throw Error(`Unknown sortBy type: ${sortConfig.sortBy}`);

  }
  return arr;
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

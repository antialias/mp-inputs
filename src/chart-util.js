import { objectFromPairs, unique } from './util';

// transpose a 2-dimensional array
// [[1, 2, 3],    [[1, 4],
//  [4, 5, 6]] =>  [2, 5],
//                 [3, 6]]
export function transpose(matrix) {
  if (matrix && matrix.length) {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
  }
  return matrix;
}

// given an array of values and a start index,
// count the number of the value at the start index repeats:
// countRun(['a', 'a', 'b', 'b', 'b', 'c'], 2) => 3
export function countRun(row, start) {
  let i;
  for (i = start; row[i] === row[start]; i++);
  return i - start;
}

// get the ideal "distance" between ticks for a given range
// results in a value like 5, 10, 25, 50, 100, 250, 500, etc.
export function getTickDistance(max, min=0, targetNumTicks=10) {
  let distance = 5;
  while ((max - min) / distance > targetNumTicks) {
    distance *= Number.isInteger(Math.log10(distance)) ? 2.5 : 2;
  }
  return distance;
}

export function nestedObjectDepth(obj) {
  return typeof obj === 'object' ? nestedObjectDepth(obj[Object.keys(obj)[0]]) + 1 : 0;
}

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

export function nestedObjectMax(obj) {
  if (typeof obj === 'number') { return obj; }
  return Math.max(0, Math.max(...Object.keys(obj).map(key => nestedObjectMax(obj[key]))));
}

export function nestedObjectKeys(obj, depth=1) {
  let keys = [];

  function _getKeys(obj) {
    if (nestedObjectDepth(obj) > depth) {
      Object.values(obj).forEach(_getKeys);
    } else {
      keys = keys.concat(Object.keys(obj));
    }
  }

  _getKeys(obj);

  return unique(keys);
}

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

export function nestedObjectToTableRows(obj, depth=0) {
  // Format rows for nested table, calculating necessary rowspans
  // For each row
  // ['a', 'a', 'a', 'b', 'b'] -> [{value: 'a', rowSpan: 3}, null, null, {value: 'b': rowSpan: 2}, null]
  return transpose(transpose(nestedObjectPaths(obj, depth)).map(row =>
    row.map((cell, i) =>
      i && row[i - 1] === row[i] ? null : {
        rowSpan: countRun(row, i),
        value: cell,
      }
    )
  ));
}

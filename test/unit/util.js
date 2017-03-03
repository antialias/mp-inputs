/* global describe, it */
import expect from 'expect.js';

import {
  d2Obj,
  d3Obj,
  d4Obj,
  timeseriesResultObj,
  d3ResultsObj,
} from './fixtures';

import {
  filterObject,
  flattenNestedObjectToPath,
  nestedObjectCumulative,
  reachableNodesOfKey,
  uniqueObjKeysAtDepth,
} from '../../src/util';

import {
  dataObjectToSortedSeries,
  transposeColsToRows,
} from '../../src/util/chart';



describe(`filterObject`, () => {
  it(`filters one value at lowest depth`, () => {
    const arr = filterObject(d4Obj, (value, depth) => depth === 1 ? value !== `red` : `false`);
    expect(arr).to.eql({
      bunnies: {
        US: {
          llama: { 'blue': 2 },
          aardvark: { 'blue': 16 },
        },
        Canada: {
          llama: { 'blue': 13 },
          aardvark: { 'blue': 5 },
        },
      },
      kittens: {
        US: {
          llama: { 'blue': 12 },
          aardvark: { 'blue': 6 },
        },
        Canada: {
          llama: { 'blue': 3 },
          aardvark: { 'blue': 15 },
        },
      },
    });
  });

  it(`filters all values at middle depth`, () => {
    const arr = filterObject(d4Obj, (value, depth) => depth === 3 ? ![`US`, `Canada`].includes(value) : `false`);
    expect(arr).to.be.empty();
  });

  it(`filters one value at top level`, () => {
    const arr = filterObject(d4Obj, (value, depth) => depth === 4 ? value !== `kittens` : `false`);
    expect(arr).to.eql({
      "bunnies": {
        "Canada": {
          "aardvark": {
            "blue": 5,
            "red": 1,
          },
          "llama": {
            "blue": 13,
            "red": 10,
          },
        },
        "US": {
          "aardvark": {
            "blue": 16,
            "red": 2,
          },
          "llama": {
            "blue": 2,
            "red": 3,
          },
        },
      },
    });
  });
});


describe(`flattenNestedObjectToPath`, () => {
  it(`flattens a 2d object to values and paths`, () => {
    const obj = flattenNestedObjectToPath(d2Obj, {flattenValues: true});
    expect(obj).to.eql({
      'paths': {
        'Canada': [`Canada`],
        'Mexico': [`Mexico`],
        'US': [`US`],
      },
      'values': {
        'Canada': 19,
        'Mexico': 42,
        'US': 13,
      },
    });
  });

  it(`flattens a 3d object to values and paths`, () => {
    const obj = flattenNestedObjectToPath(d3Obj, {flattenValues: true});
    expect(obj).to.eql({
      'paths': {
        'US llama': [`US`, `llama`],
        'US aardvark': [`US`, `aardvark`],
        'Canada llama': [`Canada`, `llama`],
        'Canada aardvark': [`Canada`, `aardvark`],
      },
      'values': {
        'US llama': 5,
        'US aardvark': 8,
        'Canada llama': 13,
        'Canada aardvark': 6,
      },
    });
  });

  it(`flattens a 2d object to values and paths with a custom key`, () => {
    const obj = flattenNestedObjectToPath(d3Obj, {
      flattenValues: true,
      formatHeader: keys => keys.map((key, idx) => `${idx + 1}) ${key}`).join(`, `),
    });
    expect(obj).to.eql({
      'paths': {
        '1) Canada, 2) llama': [`Canada`, `llama`],
        '1) Canada, 2) aardvark': [`Canada`, `aardvark`],
        '1) US, 2) llama': [`US`, `llama`],
        '1) US, 2) aardvark': [`US`, `aardvark`],
      },
      'values': {
        '1) Canada, 2) llama': 13,
        '1) Canada, 2) aardvark': 6,
        '1) US, 2) llama': 5,
        '1) US, 2) aardvark': 8,
      },
    });
  });
});

describe(`nestedObjectCumulative`, () => {
  it(`supports rolling sum on the leaf nodes`, () => {
    const arr = nestedObjectCumulative(timeseriesResultObj);
    expect(arr).to.eql({
      US: {
        '1464739200000': 8,
        '1464825600000': 10,
        '1464912000000': 12,
        '1464998400000': 20,
        '1465084800000': 34,
      },
      Canada: {
        '1464739200000': 6,
        '1464825600000': 9,
        '1464912000000': 12,
        '1464998400000': 24,
        '1465084800000': 30,
      },
    });
  });
});

describe(`uniqueObjKeysAtDepth`, () => {
  it(`produces unique keys for lowest depth`, () => {
    const arr = uniqueObjKeysAtDepth(d4Obj, 1);
    expect(arr).to.have.length(2);
    expect(arr).to.contain(`blue`, `red`);
  });

  it(`produces unique keys for top level`, () => {
    const arr = uniqueObjKeysAtDepth(d4Obj, 4);
    expect(arr).to.have.length(2);
    expect(arr).to.contain(`bunnies`, `kittens`);
  });
});


describe(`reachableNodesOfKey`, () => {
  it(`finds family for keys at lowest depth`, () => {
    const ancestorsOfChrome = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 2,
      keysToMatch: [`Chrome`],
    });
    expect(ancestorsOfChrome).to.eql({
      '2': { Chrome: true },
      '3': { 'Mac OS X': true, Windows: true },
      '4': { 'Viewed Report': true, 'Viewed Signup': true },
    });

    const ancestorsOfSafari = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 2,
      keysToMatch: [`Safari`],
    });
    expect(ancestorsOfSafari).to.eql({
      '2': { Safari: true },
      '3': { 'Mac OS X': true, Linux: true },
      '4': { 'Viewed Report': true, 'Viewed Signup': true },
    });
  });

  it(`finds family at a center key depth`, () => {
    const ancestorsOfWindows = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 3,
      keysToMatch: [`Windows`],
    });
    expect(ancestorsOfWindows).to.eql({
      '2': { Chrome: true, Firefox: true, Opera: true },
      '3': { Windows: true },
      '4': { 'Viewed Report': true, 'Viewed Signup': true },
    });
  });

  it(`finds family at heighest key depth`, () => {
    const ancestorsOfWindows = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 4,
      keysToMatch: [`Viewed Report`],
    });
    expect(ancestorsOfWindows).to.eql({
      '2': { Chrome: true, Firefox: true, Opera: true, Safari: true },
      '3': { 'Mac OS X': true, Windows: true },
      '4': { 'Viewed Report': true },
    });
  });
});

describe(`transposeColsToRows`, () => {
  it(`throws when series is not a table`, () => {
    expect(() => {
      transposeColsToRows([`$browser`], {}, `Total number of`);
    }).to.throwError();
  });

  it(`transposes cols to rows`, () => {
    expect(transposeColsToRows(
      [`$browser`, `$city`],
      {
        Chrome: {
          Sydney: 10,
          London: 20,
        },
        Safari: {
          Sydney: 10,
          London: 20,
        },
      },
      `Total number of`
    )).to.eql({
      headers: [`$browser`, `$city`, `Total number of`],
      series: {
        Chrome: {
          Sydney: { 'Total number of': 10 },
          London: { 'Total number of': 20 },
        },
        Safari: {
          Sydney: { 'Total number of': 10 },
          London: { 'Total number of': 20 },
        },
      },
    });
  });
});

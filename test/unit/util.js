/* global describe, it */
import expect from 'expect.js';

import {
  d2Obj,
  d3Obj,
  d4Obj,
  timeseriesResultObj,
  d2ResultsObj,
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
  it(`convert 2d series object to segment values and paths`, () => {
    const obj = flattenNestedObjectToPath(d2ResultsObj.series);
    expect(obj).to.eql({
      paths:{
        'Mac OS X Chrome':['Mac OS X', 'Chrome'],
        'Mac OS X Firefox':['Mac OS X', 'Firefox'],
        'Mac OS X Opera':['Mac OS X', 'Opera'],
        'Mac OS X Safari':['Mac OS X', 'Safari'],
        'Windows Chrome':['Windows', 'Chrome'],
        'Windows Firefox':['Windows', 'Firefox'],
        'Windows Opera':['Windows', 'Opera'],
      },
      values:{
        'Mac OS X Chrome':{
          '1472626800000':1990,
          '1472630400000':2122,
          '1472634000000':2035,
        },
        'Mac OS X Firefox':{
          '1472626800000':56,
          '1472630400000':93,
          '1472634000000':82,
        },
        'Mac OS X Opera':{
          '1472626800000':0,
          '1472630400000':0,
          '1472634000000':0,
        },
        'Mac OS X Safari':{
          '1472626800000':329,
          '1472630400000':459,
          '1472634000000':579,
        },
        'Windows Chrome':{
          '1472626800000':1300,
          '1472630400000':1212,
          '1472634000000':1162,
        },
        'Windows Firefox':{
          '1472626800000':100,
          '1472630400000':131,
          '1472634000000':138,
        },
        'Windows Opera':{
          '1472626800000':1,
          '1472630400000':1,
          '1472634000000':3,
        }
      }
    });
  });

  it(`convert 2d series object to segment values and paths and flattens time values`, () => {
    const obj = flattenNestedObjectToPath(d2ResultsObj.series, {flattenValues: true});
    expect(obj).to.eql({
      paths:{
        'Mac OS X Chrome':['Mac OS X', 'Chrome'],
        'Mac OS X Firefox':['Mac OS X', 'Firefox'],
        'Mac OS X Opera':['Mac OS X', 'Opera'],
        'Mac OS X Safari':['Mac OS X', 'Safari'],
        'Windows Chrome':['Windows', 'Chrome'],
        'Windows Firefox':['Windows', 'Firefox'],
        'Windows Opera':['Windows', 'Opera'],
      },
      values:{
        'Mac OS X Chrome': 6147,
        'Mac OS X Firefox': 231,
        'Mac OS X Safari': 1367,
        'Windows Chrome': 3674,
        'Windows Firefox': 369,
        'Windows Opera': 5,
      }
    });
  });

  it(`convert 3d series object to segment values and paths`, () => {
    const obj = flattenNestedObjectToPath(d3ResultsObj.series);
    expect(obj).to.eql({
      'paths':{
        'Viewed Report Mac OS X Chrome':['Viewed Report', 'Mac OS X', 'Chrome'],
        'Viewed Report Mac OS X Safari': ['Viewed Report', 'Mac OS X', 'Safari'],
        'Viewed Report Windows Chrome': ['Viewed Report', 'Windows', 'Chrome'],
        'Viewed Report Windows Firefox': ['Viewed Report', 'Windows', 'Firefox'],
        'Viewed Report Windows Opera': ['Viewed Report', 'Windows', 'Opera'],
        'Viewed Signup Linux Firefox': ['Viewed Signup', 'Linux', 'Firefox'],
        'Viewed Signup Linux Safari': ['Viewed Signup', 'Linux', 'Safari'],
        'Viewed Signup Windows Chrome': ['Viewed Signup', 'Windows', 'Chrome'],
        'Viewed Signup Windows Firefox': ['Viewed Signup', 'Windows', 'Firefox'],
      },
      'values':{
        'Viewed Report Mac OS X Chrome':{
          '1472626800000':1990,
          '1472630400000':2122,
          '1472634000000':2035,
        },
        'Viewed Report Mac OS X Safari':{
          '1472626800000':329,
          '1472630400000':459,
          '1472634000000':579,
        },
        'Viewed Report Windows Chrome':{
          '1472626800000':1300,
          '1472630400000':1212,
          '1472634000000':1162,
        },
        'Viewed Report Windows Firefox':{
          '1472626800000':100,
          '1472630400000':131,
          '1472634000000':138,
        },
        'Viewed Report Windows Opera':{
          '1472626800000':1,
          '1472630400000':1,
          '1472634000000':3,
        },
        'Viewed Signup Linux Firefox':{
          '1472626800000':56,
          '1472630400000':93,
          '1472634000000':82,
        },
        'Viewed Signup Linux Safari':{
          '1472626800000':0,
          '1472630400000':0,
          '1472634000000':0,
        },
        'Viewed Signup Windows Chrome':{
          '1472626800000':1300,
          '1472630400000':1212,
          '1472634000000':1162,
        },
        'Viewed Signup Windows Firefox':{
          '1472626800000':100,
          '1472630400000':131,
          '1472634000000':138,
        }
      }
    });
  });

  it(`convert 3d series object to segment values and paths and flattens time values`, () => {
    const obj = flattenNestedObjectToPath(d3ResultsObj.series, {flattenValues: true});
    expect(obj).to.eql({
      'paths':{
        'Viewed Report Mac OS X Chrome':['Viewed Report', 'Mac OS X', 'Chrome'],
        'Viewed Report Mac OS X Safari': ['Viewed Report', 'Mac OS X', 'Safari'],
        'Viewed Report Windows Chrome': ['Viewed Report', 'Windows', 'Chrome'],
        'Viewed Report Windows Firefox': ['Viewed Report', 'Windows', 'Firefox'],
        'Viewed Report Windows Opera': ['Viewed Report', 'Windows', 'Opera'],
        'Viewed Signup Linux Firefox': ['Viewed Signup', 'Linux', 'Firefox'],
        'Viewed Signup Linux Safari': ['Viewed Signup', 'Linux', 'Safari'],
        'Viewed Signup Windows Chrome': ['Viewed Signup', 'Windows', 'Chrome'],
        'Viewed Signup Windows Firefox': ['Viewed Signup', 'Windows', 'Firefox'],
      },
      'values':{
        'Viewed Report Mac OS X Chrome': 6147,
        'Viewed Report Mac OS X Safari': 1367,
        'Viewed Report Windows Chrome': 3674,
        'Viewed Report Windows Firefox': 369,
        'Viewed Report Windows Opera': 5,
        'Viewed Signup Linux Firefox': 231,
        'Viewed Signup Windows Chrome': 3674,
        'Viewed Signup Windows Firefox': 369,
      }
    });
  });


  it(`handles a custom header formatting`, () => {
    const obj = flattenNestedObjectToPath(d2ResultsObj.series, {
      flattenValues: true,
      formatHeader: keys => keys.map((key, idx) => `${idx + 1}) ${key}`).join(`, `),
    });
    expect(obj).to.eql({
      paths: {
        '1) Mac OS X, 2) Chrome': [ 'Mac OS X', 'Chrome' ],
        '1) Mac OS X, 2) Firefox': [ 'Mac OS X', 'Firefox' ],
        '1) Mac OS X, 2) Opera': [ 'Mac OS X', 'Opera' ],
        '1) Mac OS X, 2) Safari': [ 'Mac OS X', 'Safari' ],
        '1) Windows, 2) Chrome': [ 'Windows', 'Chrome' ],
        '1) Windows, 2) Firefox': [ 'Windows', 'Firefox' ],
        '1) Windows, 2) Opera': [ 'Windows', 'Opera' ],
      },
      values: {
        '1) Mac OS X, 2) Chrome': 6147,
        '1) Mac OS X, 2) Firefox': 231,
        '1) Mac OS X, 2) Safari': 1367,
        '1) Windows, 2) Chrome': 3674,
        '1) Windows, 2) Firefox': 369,
        '1) Windows, 2) Opera': 5,
      },
    })
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

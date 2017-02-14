import expect from 'expect.js';

import {
  d2Obj,
  d3Obj,
  d4Obj,
  timeseriesResultObj,
  d3ResultsObj
} from './fixtures';

import {
  filterObject,
  flattenNestedObjectToPath,
  nestedObjectCumulative,
  nestedObjectRolling,
  reachableNodesOfKey,
  resultToCSVArray,
  uniqueObjKeysAtDepth,
} from '../src/util';

describe('filterObject', function() {
  it('filters one value at lowest depth', function() {
    const arr = filterObject(d4Obj, (value, depth) => depth === 1 ? value !== 'red' : 'false');
    expect(arr).to.eql({
      bunnies: {
        US: {
          llama: {'blue':2},
          aardvark: {'blue':16}
        },
        Canada: {
          llama: {'blue':13},
          aardvark: {'blue':5}
        }
      },
      kittens: {
        US:{
          llama: {'blue':12},
          aardvark: {'blue':6}
        },
        Canada: {
          llama: {'blue':3},
          aardvark: {'blue':15}
        }
      }
    });
  });

  it('filters all values at middle depth', function() {
    const arr = filterObject(d4Obj, (value, depth) => depth === 3 ? !['US', 'Canada'].includes(value) : 'false');
    expect(arr).to.be.empty();
  });

  it('filters one value at top level', function() {
    const arr = filterObject(d4Obj, (value, depth) => depth === 4 ? value !== 'kittens' : 'false');
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
      }
    });
  });
});


describe('flattenNestedObjectToPath', function() {
  it('flattens a 2d object to values and paths', function() {
    const obj = flattenNestedObjectToPath(d2Obj);
    expect(obj).to.eql({
      'paths': {
        'Canada aardvark': ['Canada', 'aardvark'],
        'Canada llama': ['Canada', 'llama'],
        'Mexico aardvark': ['Mexico', 'aardvark'],
        'Mexico llama': ['Mexico', 'llama'],
        'US aardvark': ['US', 'aardvark'],
        'US llama': ['US', 'llama'],
      },
      'values': {
        'Canada aardvark': 6,
        'Canada llama': 13,
        'Mexico aardvark': 7,
        'Mexico llama': 35,
        'US aardvark': 8,
        'US llama': 5,
      },
    });
  });

  it('flattens a 3d object to values and paths', function() {
    const obj = flattenNestedObjectToPath(d3Obj);
    expect(obj).to.eql({
      'paths': {
        'Canada aardvark blue': ['Canada', 'aardvark', 'blue'],
        'Canada aardvark red': ['Canada', 'aardvark', 'red'],
        'Canada llama blue': ['Canada', 'llama', 'blue'],
        'Canada llama red': ['Canada', 'llama', 'red'],
        'US aardvark blue': ['US', 'aardvark', 'blue'],
        'US aardvark red': ['US', 'aardvark', 'red'],
        'US llama blue': ['US', 'llama', 'blue'],
        'US llama red': ['US', 'llama', 'red'],
      },
      'values': {
        'Canada aardvark blue': 5,
        'Canada aardvark red': 1,
        'Canada llama blue': 3,
        'Canada llama red': 10,
        'US aardvark blue': 6,
        'US aardvark red': 2,
        'US llama blue': 2,
        'US llama red': 3,
      },
    });
  });

  it('flattens a 2d object to values and paths with a custom key', function() {
    const obj = flattenNestedObjectToPath(d2Obj, {
      transformKeyName: keys => keys.map((key, idx) => `${idx + 1}) ${key}`).join(', '),
    });
    expect(obj).to.eql({
      'paths': {
        '1) Canada, 2) aardvark': ['Canada', 'aardvark'],
        '1) Canada, 2) llama': ['Canada', 'llama'],
        '1) Mexico, 2) aardvark': ['Mexico', 'aardvark'],
        '1) Mexico, 2) llama': ['Mexico', 'llama'],
        '1) US, 2) aardvark': ['US', 'aardvark'],
        '1) US, 2) llama': ['US', 'llama'],
      },
      'values': {
        '1) Canada, 2) aardvark': 6,
        '1) Canada, 2) llama': 13,
        '1) Mexico, 2) aardvark': 7,
        '1) Mexico, 2) llama': 35,
        '1) US, 2) aardvark': 8,
        '1) US, 2) llama': 5,
      },
    });
  });
});

describe('nestedObjectCumulative', function() {
  it('supports rolling sum on the leaf nodes', function() {
    const arr = nestedObjectCumulative(timeseriesResultObj);
    expect(arr).to.eql({
      US: {
        '2016-06-01': 8,
        '2016-06-02': 10,
        '2016-06-03': 12,
        '2016-06-04': 20,
        '2016-06-05': 34,
      },
      Canada: {
        '2016-06-01': 6,
        '2016-06-02': 9,
        '2016-06-03': 12,
        '2016-06-04': 24,
        '2016-06-05': 30,
      },
    });
  });
});

describe('uniqueObjKeysAtDepth', function() {
  it('produces unique keys for lowest depth', function() {
    const arr = uniqueObjKeysAtDepth(d4Obj, 1);
    expect(arr).to.have.length(2);
    expect(arr).to.contain('blue', 'red');
  });

  it('produces unique keys for top level', function() {
    const arr = uniqueObjKeysAtDepth(d4Obj, 4);
    expect(arr).to.have.length(2);
    expect(arr).to.contain('bunnies', 'kittens');
  });
});


describe('reachableNodesOfKey', function() {
  it('finds family for keys at lowest depth', function() {
    const ancestorsOfChrome = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 2,
      keysToMatch: ['Chrome'],
    });
    expect(ancestorsOfChrome).to.eql({
      '2':  {Chrome: true},
      '3':  {'Mac OS X': true, Windows: true },
      '4':  {'Viewed Report': true, 'Viewed Signup': true }
    });

    const ancestorsOfSafari = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 2,
      keysToMatch: ['Safari'],
    });
    expect(ancestorsOfSafari).to.eql({
      '2':  {Safari: true},
      '3':  {'Mac OS X': true, Linux: true },
      '4':  {'Viewed Report': true, 'Viewed Signup': true }
    });
  });

  it('finds family at a center key depth', function() {
    const ancestorsOfWindows = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 3,
      keysToMatch: ['Windows'],
    });
    expect(ancestorsOfWindows).to.eql({
      '2':  {Chrome: true, Firefox: true, Opera: true},
      '3':  {Windows: true },
      '4':  {'Viewed Report': true, 'Viewed Signup': true }
    });
  });

  it('finds family at heighest key depth', function() {
    const ancestorsOfWindows = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 4,
      keysToMatch: ['Viewed Report'],
    });
    expect(ancestorsOfWindows).to.eql({
      '2':  {Chrome: true, Firefox: true, Opera: true, Safari: true},
      '3':  {'Mac OS X': true, Windows: true},
      '4':  {'Viewed Report': true}
    });
  });

});


describe(`resultToCSVArray`, function() {
  it(`translates a simple result`, function() {
    const result = {
      headers:[
        '$event',
      ],
      series: {
        'Click run': {
          '2017-01-14T00:00:00Z': 393,
          '2017-01-15T00:00:00Z': 619,
          '2017-01-16T00:00:00Z': 2837,
        },
      },
    };
    const csvArray = resultToCSVArray(result);

    expect(csvArray).to.eql([
      [`Date`,       `Click run`],
      [`2017-01-14`, 393        ],
      [`2017-01-15`, 619        ],
      [`2017-01-16`, 2837       ],
    ]);
  });

  it(`translates a nested result`, function() {
    const result = {
      headers:[
        '$event',
        '$browser',
      ],
      series: {
        'Click run': {
          'Chrome': {
            '2017-01-14T00:00:00Z': 393,
            '2017-01-15T00:00:00Z': 619,
            '2017-01-16T00:00:00Z': 2837,
          },
          'Firefox': {
            '2017-01-14T00:00:00Z': 15,
            '2017-01-15T00:00:00Z': 6,
            '2017-01-16T00:00:00Z': 316,
          },
          'Safari': {
            '2017-01-14T00:00:00Z': 0,
            '2017-01-15T00:00:00Z': 26,
            '2017-01-16T00:00:00Z': 397,
          },
        },
      },
    };
    const csvArray = resultToCSVArray(result);

    expect(csvArray).to.eql([
      [`Date`,       `Event`,     `Chrome`, `Firefox`, `Safari`],
      [`2017-01-14`, `Click run`, 393,      15,        0       ],
      [`2017-01-15`, `Click run`, 619,      6,         26      ],
      [`2017-01-16`, `Click run`, 2837,     316,       397     ],
    ]);
  });
});

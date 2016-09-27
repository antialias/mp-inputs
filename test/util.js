import expect from 'expect.js';

import {
  d2Obj,
  d3Obj,
  d4Obj,
  timeseriesResultObj,
} from './fixtures';

import {
  filterObject,
  flattenNestedObjectToPath,
  stringFilterMatches,
  nestedObjectCumulative,
  nestedObjectRolling,
  uniqueObjKeysAtDepth,
} from '../src/util';

describe('filterObject', function() {
  it('filters one value at lowest depth', function() {
    const arr = filterObject(d4Obj, (value, depth) => depth === 1 ? value !== 'red' : 'false');
    expect(arr).to.eql({
      bunnies: {
        US: {
          llama:{'blue':2},
          aardvark:{'blue':16}
        },
        Canada:{
          llama:{'blue':13},
          aardvark:{'blue':5}
        }
      },
      kittens:{
        US:{
          llama:{'blue':12},
          aardvark:{'blue':6}
        },
        Canada:{
          llama:{'blue':3},
          aardvark:{'blue':15}
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
  it('flattens an 2d object to values and paths', function() {
    const obj = flattenNestedObjectToPath(d2Obj);
    expect(obj).to.eql({
      'paths': {
        'Canada aardvark': [
          'Canada',
          'aardvark',
        ],
        'Canada llama': [
          'Canada',
          'llama',
        ],
        'Mexico aardvark': [
          'Mexico',
          'aardvark',
        ],
        'Mexico llama': [
          'Mexico',
          'llama',
        ],
        'US aardvark': [
          'US',
          'aardvark',
        ],
        'US llama': [
          'US',
          'llama',
        ],
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

  it('flattens an 3d object to values and paths', function() {
    const obj = flattenNestedObjectToPath(d3Obj);
    expect(obj).to.eql({
      'paths': {
        'Canada aardvark blue': [
          'Canada',
          'aardvark',
          'blue',
        ],
        'Canada aardvark red': [
          'Canada',
          'aardvark',
          'red',
        ],
        'Canada llama blue': [
          'Canada',
          'llama',
          'blue',
        ],
        'Canada llama red': [
          'Canada',
          'llama',
          'red',
        ],
        'US aardvark blue': [
          'US',
          'aardvark',
          'blue',
        ],
        'US aardvark red': [
          'US',
          'aardvark',
          'red',
        ],
        'US llama blue': [
          'US',
          'llama',
          'blue',
        ],
        'US llama red': [
          'US',
          'llama',
          'red',
        ],
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

  it('flattens an 2d object to values and paths', function() {
    const obj = flattenNestedObjectToPath(d2Obj, {
      transformKeyName: keys => keys.map((key, idx) => `${idx + 1}) ${key},`).join(' '),
    });
    expect(obj).to.eql({
      'paths': {
        '1) Canada, 2) aardvark,': [
          'Canada',
          'aardvark',
        ],
        '1) Canada, 2) llama,': [
          'Canada',
          'llama',
        ],
        '1) Mexico, 2) aardvark,': [
          'Mexico',
          'aardvark',
        ],
        '1) Mexico, 2) llama,': [
          'Mexico',
          'llama',
        ],
        '1) US, 2) aardvark,': [
          'US',
          'aardvark',
        ],
        '1) US, 2) llama,': [
          'US',
          'llama',
        ],
      },
      'values': {
        '1) Canada, 2) aardvark,': 6,
        '1) Canada, 2) llama,': 13,
        '1) Mexico, 2) aardvark,': 7,
        '1) Mexico, 2) llama,': 35,
        '1) US, 2) aardvark,': 8,
        '1) US, 2) llama,': 5,
      },
    });
  });
});

describe('stringFilterMatches', function() {
  it('matches at the beginning of a string', function() {
    expect(stringFilterMatches('abcdefg', 'abc')).to.eql(['abc', 'defg']);
  });

  it('matches in the middle/end of a string', function() {
    expect(stringFilterMatches('abcdefg', 'def')).to.eql(['', 'abc', 'def', 'g']);
    expect(stringFilterMatches('abcdefg', 'efg')).to.eql(['', 'abcd', 'efg', '']);
  });

  it('returns null for non-matches', function() {
    expect(stringFilterMatches('abcdefg', 'ac')).to.eql(null);
  });

  it('is case-insensitive', function() {
    expect(stringFilterMatches('abcdefg', 'dEf')).to.eql(['', 'abc', 'def', 'g']);
    expect(stringFilterMatches('abCDEfg', 'dEF')).to.eql(['', 'abC', 'DEf', 'g']);
  });

  it('ignores whitespace padding', function() {
    expect(stringFilterMatches('abcdefg', '   def')).to.eql(['', 'abc', 'def', 'g']);
    expect(stringFilterMatches('abcdefg', 'abc   ')).to.eql(['abc', 'defg']);
    expect(stringFilterMatches('abcdefg', '  abc ')).to.eql(['abc', 'defg']);
  });

  it('matches when no filter string is passed', function() {
    expect(stringFilterMatches('abcdefg', '')).to.eql(['', 'abcdefg']);
    expect(stringFilterMatches('abcdefg', null)).to.eql(['', 'abcdefg']);
  });

  it('matches when all space-separated terms match', function() {
    expect(stringFilterMatches('abcdefg', 'abc efg')).to.eql(['abc', 'd', 'efg', '']);
    expect(stringFilterMatches('abcdefg', 'abc   efg')).to.eql(['abc', 'd', 'efg', '']);
    expect(stringFilterMatches('abcdefg', '  abc   efg   ')).to.eql(['abc', 'd', 'efg', '']);
  });

  it('matches out of order', function() {
    expect(stringFilterMatches('abcdefg', 'efg abc')).to.eql(['abc', 'd', 'efg', '']);
  });

  it('merges contiguous matches', function() {
    expect(stringFilterMatches('abcdefg', 'efg bcd')).to.eql(['', 'a', 'bcdefg', '']);
  });

  it('does not match when one or more space-separated terms do not match', function() {
    expect(stringFilterMatches('abcdefg', 'abc xxx')).to.eql(null);
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

describe('nestedObjectRolling', function() {
  it('supports rolling average on the leaf nodes without enought data for a window', function() {
    const arr = nestedObjectRolling(timeseriesResultObj, 7);
    expect(arr).to.eql({
      US: {
        '2016-06-01': 8,
        '2016-06-02': 5,
        '2016-06-03': 4,
        '2016-06-04': 5,
        '2016-06-05': 6.8,
      },
      Canada: {
        '2016-06-01': 6,
        '2016-06-02': 4.5,
        '2016-06-03': 4,
        '2016-06-04': 6,
        '2016-06-05': 6,
      },
    });
  });

  it('supports rolling average on the leaf nodes with more data than a window', function() {
    const arr = nestedObjectRolling(timeseriesResultObj, 3);
    expect(arr).to.eql({
      US: {
        '2016-06-01': 8,
        '2016-06-02': 5,
        '2016-06-03': 4,
        '2016-06-04': 4,
        '2016-06-05': 8,
      },
      Canada: {
        '2016-06-01': 6,
        '2016-06-02': 4.5,
        '2016-06-03': 4,
        '2016-06-04': 6,
        '2016-06-05': 7,
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

import expect from 'expect.js';

import {
  d4Obj,
  timeseriesResultObj,
} from './fixtures';

import {
  filterObject,
  matchesStringFilter,
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

describe('matchesStringFilter', function() {
  it('matches at the beginning of a string', function() {
    expect(matchesStringFilter('abc', 'abcdefg')).to.be.true;
  });

  it('matches in the middle/end of a string', function() {
    expect(matchesStringFilter('def', 'abcdefg')).to.be.true;
    expect(matchesStringFilter('efg', 'abcdefg')).to.be.true;
  });

  it('returns false for non-matches', function() {
    expect(matchesStringFilter('ac', 'abcdefg')).to.be.false;
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

import expect from 'expect.js';

import {
  timeseriesResultObj,
} from './sample-data';

import {
  filterObject,
  nestedObjectCumulative,
  nestedObjectRolling,
} from '../src/util';

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

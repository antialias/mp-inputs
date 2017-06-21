import expect from 'expect.js';

import { d2ResultsObj } from './fixtures';

import { flattenNestedObjectToPath } from '../../src/util';


import {
  dataObjectToSortedSeries,
  generateChangeId,
} from '../../src/util/chart/line';

describe(`dataObjectToSortedSeries`, () => {
  it(`convert flat series to time sorted data for Highcharts`, () => {
    const flattenedSeries = flattenNestedObjectToPath(d2ResultsObj.series)
    expect(dataObjectToSortedSeries(flattenedSeries.values)).to.eql([
      {
        'data': [[1472626800000, 1990], [1472630400000, 2122], [1472634000000, 2035]],
        'name': 'Mac OS X Chrome',
      },
      {
        'data': [[1472626800000, 56], [1472630400000, 93], [1472634000000, 82]],
        'name': 'Mac OS X Firefox',
      },
      {
        'data': [[1472626800000, 0], [1472630400000, 0], [1472634000000, 0]],
        'name': 'Mac OS X Opera',
      },
      {
        'data': [[1472626800000, 329], [1472630400000, 459], [1472634000000, 579]],
        'name': 'Mac OS X Safari',
      },
      {
        'data': [[1472626800000, 1300], [1472630400000, 1212], [1472634000000, 1162]],
        'name': 'Windows Chrome',
      },
      {
        'data': [[1472626800000, 100], [1472630400000, 131], [1472634000000, 138]],
        'name': 'Windows Firefox',
      },
      {
        'data': [[1472626800000, 1], [1472630400000, 1], [1472634000000, 3]],
        'name': 'Windows Opera',
      },
    ]);
  })
});

describe(`generateChangeId`, () => {
  it(`does not generate ID for no params`, () => {
    expect(generateChangeId({})).to.eql(null);
  });

  it(`does not generate ID for missing params`, () => {
    expect(generateChangeId({
      dataId: 17,
      displayOptions: {analysis: 'analysis', plotStyle: 'plotStyle'},
      segmentColorMap: {},
      utcOffset: 38,
    })).to.eql(null);
  });

  it(`does not generate ID for a null value`, () => {
    expect(generateChangeId({
      dataId: 17,
      displayOptions: {analysis: 'analysis', plotStyle: 'plotStyle', value: null, timeUnit: 'timeUnit'},
      headers: ['$events'],
      segmentColorMap: {segment: 'color'},
      utcOffset: 38,
    })).to.eql(null);
  });

  it(`generates ID when all params exist`, () => {
    expect(generateChangeId({
      dataId: 17,
      displayOptions: {analysis: 'analysis', plotStyle: 'plotStyle', value: 'value', timeUnit: 'timeUnit'},
      headers: ['$events'],
      segmentColorMap: {segment: 'color'},
      utcOffset: 38,
    })).to.eql(`17-38-analysis-true-true-plotStyle-timeUnit-value`);
  });

  it(`generates ID for falsey values as keys`, () => {
    expect(generateChangeId({
      dataId: 0,
      displayOptions: {analysis: false, plotStyle: 'false', value: '', timeUnit: []},
      headers: [],
      segmentColorMap: {segment: 'color'},
      utcOffset: 38,
    })).to.eql(`0-38-false-true-true-false--`);
  });

  it(`produces the same IDs for the unchanged objects`, () => {
    const chartObject = {
      dataId: 12,
      displayOptions: {analysis: 'linear', plotStyle: 'standard', value: 'absolute', timeUnit: 'hour'},
      headers: ['$events'],
      segmentColorMap: {segment: 1},
      utcOffset: 90,
    };
    expect(generateChangeId(chartObject)).to.eql(generateChangeId(chartObject));
  });

  it(`produces the new IDs for changed objects`, () => {
    const chartObject = {
      dataId: 12,
      displayOptions: {analysis: 'linear', plotStyle: 'standard', value: 'absolute', timeUnit: 'hour'},
      headers: ['$events'],
      segmentColorMap: {segment: 1},
      utcOffset: 90,
    };
    const originalID = generateChangeId(chartObject);
    chartObject.dataId++;
    chartObject.displayOptions.plotStyle = 'stacked';
    expect(originalID).to.not.eql(generateChangeId(chartObject));
  });
});


import expect from 'expect.js';

import { d2ResultsObj } from './fixtures';

import { flattenNestedObjectToPath } from '../../src/util';


import {
  dataObjectToSortedSeries,
  generateChangeId,
} from '../../src/insights-app/insights-result/chart-display/line-chart/line-chart-util.js';

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
  it(`does not generate a change ID until all attributes are present`, () => {
    const id_one = generateChangeId({});
    generateChangeId({
      dataId: 17,
      displayOptions: {},
      utcOffset: 38,
    });
    const id_two = generateChangeId({
      dataId: 17,
      displayOptions: {analysis: 'analysis', plotStyle: 'plotStyle'},
      segmentColorMap: {},
      utcOffset: 38,
    });
    const id_three = generateChangeId({
      dataId: 17,
      displayOptions: {analysis: 'analysis', plotStyle: 'plotStyle', value: null, timeUnit: 'timeUnit'},
      segmentColorMap: {segment: 'color'},
      utcOffset: 38,
    });
    const id_four = generateChangeId({
      dataId: 17,
      displayOptions: {analysis: 'analysis', plotStyle: 'plotStyle', value: 'value', timeUnit: 'timeUnit'},
      segmentColorMap: {segment: 'color'},
      utcOffset: 38,
    });

    expect([id_one, id_two, id_three, id_four]).to.eql([null, null, null, `17-38-analysis-plotStyle-value-timeUnit-true`])
  })

  it(`allows falsey values as keys`, () => {
    expect(generateChangeId({
      dataId: 0,
      displayOptions: {analysis: false, plotStyle: 'false', value: '', timeUnit: []},
      segmentColorMap: {segment: 'color'},
      utcOffset: 38,
    })).to.eql(`0-38-false-false---true`)
  })
});


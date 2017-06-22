import isEqual from 'lodash/isEqual';
import {
  nestedObjectCumulative,
  nestedObjectRolling,
  pick,
} from '../util';

let resultID = 0;

export default class Result {
  constructor(attrs) {
    Object.assign(this, pick(attrs, [`headers`, `series`, `peopleTimeSeries`]));
    this._isEmptyResult = !Object.keys(this.series).length;
    this.id = resultID++;
  }

  dataForLineChart() {
    return this.peopleTimeSeries || this.series;
  }

  isEqual(result) {
    return isEqual(this.headers, result.headers) && isEqual(this.series, result.series);
  }

  isEmptyResult() {
    return this._isEmptyResult;
  }

  transformed(options) {
    // for 'logarithmic', no transformation on the result is needed, we use 'linear' here and leave
    // it to 'line' and 'bar' to display correctly.
    let newSeries = this.series;
    let newpeopleTimeSeries = this.peopleTimeSeries;

    if (options.analysis !== `logarithmic`) {
      // compute transformation
      switch (options.analysis) {
        case `cumulative`:
          newSeries = nestedObjectCumulative(newSeries);
          newpeopleTimeSeries = newpeopleTimeSeries && nestedObjectCumulative(newpeopleTimeSeries);
          break;
        case `rolling`:
          newSeries = nestedObjectRolling(newSeries, options.windowSize);
          newpeopleTimeSeries = newpeopleTimeSeries && nestedObjectRolling(newpeopleTimeSeries, options.windowSize);
          break;
      }
    }

    return {
      headers: this.headers,
      series: newSeries,
      peopleTimeSeries: newpeopleTimeSeries,
      id: [this.id, options.analysis, options.windowSize].join(`-`),
    };
  }
}

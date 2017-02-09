import { isEqual, nestedObjectCumulative, nestedObjectRolling, pick } from '../util';

let resultID = 0;

export default class Result {
  constructor(attrs) {
    Object.assign(this, pick(attrs, [`headers`, `series`, `peopleTimeSeries`]));
    this.id = resultID++;
  }

  dataForLineChart() {
    return this.peopleTimeSeries || this.series;
  }

  isEqual(result) {
    return isEqual(this.headers, result.headers) && isEqual(this.series, result.series);
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
          newSeries = nestedObjectCumulative(this.series);
          if (newpeopleTimeSeries) {
            newpeopleTimeSeries = nestedObjectCumulative(this.series);
          }
          break;
        case `rolling`:
          newSeries = nestedObjectRolling(this.series, options.windowSize);
          if (newpeopleTimeSeries) {
            newpeopleTimeSeries = nestedObjectCumulative(this.series, options.windowSize);
          }
          break;
      }
    }

    return {
      headers: this.headers,
      series: newSeries,
      peopleTimeSeries: newpeopleTimeSeries,
    };
  }
}

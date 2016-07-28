import { pick } from '../util';
import { nestedObjectCumulative, nestedObjectRolling } from '../irb-app/irb-result/chart-util';

export default class Result {
  constructor(attrs) {
    Object.assign(this, pick(attrs, ['headers', 'series']));
  }

  transformed(options) {
    // for 'logarithmic', no transformation on the result is needed, we use 'linear' here and leave
    // it to 'line' and 'bar' to display correctly.
    let newSeries = this.series;

    if (options.analysis !== 'logarithmic') {
      // compute transformation
      switch (options.analysis) {
        case 'cumulative':
          newSeries = nestedObjectCumulative(this.series);
          break;
        case 'rolling':
          newSeries = nestedObjectRolling(this.series, options.windowSize);
          break;
      }
    }

    return {
      headers: this.headers,
      series: newSeries,
    };
  }
}

import BaseQuery from './base';
import { extend, formatDateISO, pick } from '../../util';

import main from './extrema.jql.js';

export function extremaResultToBuckets(result, {numBuckets=10}={}) {
  const extremaDelta = result.max - result.min;
  if (extremaDelta < numBuckets) {
    return {};
  }

  let bucketSize = extremaDelta / numBuckets;
  const buckets = [];
  const bucketRanges = {};
  for (let i = 0; i < numBuckets; i++) {
    const bucketBottom = Math.floor(result.min + bucketSize * i);
    const bucketTop = (i === numBuckets - 1) ? result.max : Math.floor(bucketBottom + bucketSize);
    buckets.push(bucketBottom);
    bucketRanges[bucketBottom] = [bucketBottom, bucketTop];
  }
  return {buckets, bucketRanges};
}

export default class ExtremaJQLQuery extends BaseQuery {
  buildQuery(state) {
    return state;
  }

  buildOptions() {
    return {type: `POST`};
  }

  buildParams({params={}}={}) {
    params = extend(params, pick(this.query, [`events`, `property`, `isPeopleProperty`]));
    params.from = formatDateISO(this.query.from);
    params.to = formatDateISO(this.query.to);
    params.propertyPath = `properties.${params.property}`;
    return {
      script: String(main),
      params: JSON.stringify(params),
    };
  }

  buildUrl() {
    return `api/2.0/jql`;
  }

  runJQLQueries() {
    return [`min`, `max`].map(task => (
      new Promise(resolve => {
        this.fetch(this.buildUrl(), this.buildParams({params: {task}}), this.buildOptions())
          .then(results => resolve({[task]: results}));
      })
    ));
  }

  executeQuery() {
    return Promise.all(this.runJQLQueries());
  }

  processResults(results) {
    let flatResult = results.reduce((obj, result) => {
      Object.keys(result).forEach(task => {
        obj[task] = result[task][0];
      });
      return obj;
    }, {});

    return extremaResultToBuckets(flatResult);
  }
}

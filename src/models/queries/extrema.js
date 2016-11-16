import BaseQuery from './base';
import { pick } from '../../util';

import main from './extrema.jql.js';

export function extremaResultToBuckets(result) {
  const extremaDelta = result.max - result.min;
  if (extremaDelta < 50) {
    return {};
  }

  const numBuckets = 10;
  let bucketSize = extremaDelta / numBuckets;
  const buckets = [];
  const bucketRanges = {};
  for (let i = 0; i < numBuckets + 2; i++) {
    const bucket = Math.floor(result.min + bucketSize * i);
    buckets.push(bucket);
    if (i) {
      bucketRanges[buckets[i-1]] = [buckets[i-1], bucket];
    }
  }
  bucketRanges[buckets[buckets.length - 1]] = [buckets[buckets.length - 1], Math.floor(result.min + bucketSize * buckets.length)];
  return {buckets, bucketRanges};
}

export default class ExtremaJQLQuery extends BaseQuery {
  buildQuery(state) {
    return state;
  }

  buildOptions() {
    return {type: `POST`};
  }

  buildParams() {
    const params = pick(this.query, [`events`, `property`, `isPeopleProperty`]);
    params.from = this.query.from.toISOString().split(`T`)[0];
    params.to = this.query.to.toISOString().split(`T`)[0];
    params.task = this.task;
    params.propertyPath = `${params.isPeopleProperty ? `user.` : ``}properties.${params.property}`;
    return {
      script: String(main),
      params: JSON.stringify(params),
    };
  }

  setTask(task) {
    this.task = task;
    return this;
  }

  buildJQLArgs() {
    // prepare args for each JQL Query.
    return this.query.jqlQueries.map(jqlQuery =>
      this.buildJQLParams(jqlQuery).then(jqlParams =>
        [this.buildUrl(), this.buildParams(jqlParams), this.buildOptions()]));
  }

  buildUrl() {
    return `api/2.0/jql`;
  }

  runJQLQueries() {
    return [`min`, `max`].map(task => (
      new Promise(resolve => {
        this.setTask(task)
          .fetch(this.buildUrl(), this.buildParams(), this.buildOptions())
          .then(results => {
            resolve({[task]: results});
          });
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

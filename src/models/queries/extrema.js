import BaseQuery from './base';
import { extend, pick } from '../../util';

export function extremaResultToBuckets(result) {
  if (!result.cardinality || result.cardinality !== `high`) {
    return {};
  }
  let bucketSize = result.bucket_size; // eslint-disable-line camelcase
  if (bucketSize < 1) {
    bucketSize = Math.floor(result.multiplier * bucketSize);
  }
  const numBuckets = Math.floor((result.max - result.min) / bucketSize);
  const buckets = [];
  for (let i = 0; i < numBuckets + 2; i++) {
    buckets.push(Math.floor(result.min + bucketSize * i));
  }

  return {buckets};
}

export default class ExtremaQuery extends BaseQuery {
  buildQuery(state) {
    return state;
  }

  buildParams() {
    const params = extend(pick(this.query, [`event`, `on`, `allow_fewer_buckets`, `allow_more_buckets`, `buckets`]),
      {
        /* eslint-disable camelcase */
        from_date: this.query.from.toISOString().split(`T`)[0],
        to_date: this.query.to.toISOString().split(`T`)[0],
        interval: Math.min(36, this.query.interval),
        cardinality_threshold: 50,
        /* eslint-enable camelcase */
      });
    if (this.query.where) {
      params[`selector`] = this.query.where;
    }

    return params;
  }

  buildUrl() {
    return `api/2.0/segmentation/extrema`;
  }

  processResults(result) {
    return extremaResultToBuckets(result);
  }
}

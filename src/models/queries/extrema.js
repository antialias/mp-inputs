import BaseQuery from './base';
import { extend, pick } from '../../util';

export default class ExtremaQuery extends BaseQuery {
  buildQuery(state) {
    return state;
  }

  buildParams() {
    const params = extend(pick(this.query, ['event', 'on', 'allow_fewer_buckets', 'allow_more_buckets', 'buckets']),
      {
        from_date: this.query.from.toISOString().split('T')[0],
        to_date: this.query.to.toISOString().split('T')[0],
        interval: Math.min(36, this.query.interval),
        cardinality_threshold: 50
      });
    if (this.query.where) {
      params['selector'] = this.query.where;
    }

    return params;
  }

  buildUrl() {
    return 'api/2.0/segmentation/extrema';
  }
}

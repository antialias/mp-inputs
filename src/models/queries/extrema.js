import BaseQuery from './base';

export default class ExtremaQuery extends BaseQuery {
  buildQuery(state) {
    return state;
  }

  buildParams() {
    let params = {
      from_date: this.query.from.toISOString().split('T')[0],
      to_date: this.query.to.toISOString().split('T')[0],
      event: this.query.event,
      on: this.query.on,
      interval: Math.min(36, this.query.interval),
      cardinality_threshold: 50,
      allow_more_buckets: this.query.allow_more_buckets,
      buckets: this.query.buckets,
    };
    if (this.query.where) {
      params['selector'] = this.query.where;
    }

    return params;
  }

  buildUrl() {
    return 'api/2.0/segmentation/extrema';
  }
}

import BaseQuery from './base';
import QueryCache from './query-cache';

export default class SegmentationQuery extends BaseQuery {
  buildUrl() {
    return `api/2.0/insights`;
  }

  buildQuery(state, options) {
    return state.report.toBookmarkData();
  }

  buildParams(params) {
    return {
      params: JSON.stringify(this.query),
    };
  }
}

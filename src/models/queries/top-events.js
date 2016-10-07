import BaseQuery from './base';

export default class TopEventsQuery extends BaseQuery {
  MPApiQuery() {
    return window.MP.api.topEvents({sort_fn: `desc`}); // eslint-disable-line camelcase
  }

  processResults(results) {
    return Object.values(results.values());
  }
}

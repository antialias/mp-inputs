import BaseQuery from './base';

export default class TopEventsQuery extends BaseQuery {
  executeQuery() {
    return window.MP.api.topEvents({sort_fn: 'desc'});
  }

  processResults(results) {
    return Object.values(results.values());
  }
}

import BaseQuery from './base';

export default class TopEventsQuery extends BaseQuery {
  executeQuery() {
    return window.MP.api.topEvents({limit: 12});
  }

  processResults(results) {
    return Object.values(results.values());
  }
}

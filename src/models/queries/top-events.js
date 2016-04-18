import BaseQuery from './base';

export default class TopPropertiesQuery extends BaseQuery {
  executeQuery(query) {
    return window.MP.api.topEvents();
  }

  processResults(results) {
    return Object.values(results.values());
  }
}

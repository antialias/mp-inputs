import BaseQuery from './base';

export default class TopPropertiesQuery extends BaseQuery {
  executeQuery(query) {
    return window.MP.api.topProperties();
  }

  processResults(results) {
    let properties = results.values();
    return Object.keys(properties)
      .sort((a, b) => properties[b] - properties[a]);
  }
}

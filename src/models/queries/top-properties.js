import BaseQuery from './base';

export default class TopPropertiesQuery extends BaseQuery {
  buildUrl(query) {
    return 'api/2.0/events/properties/toptypes';
  }

  buildParams(query) {
    return {limit: 255};
  }

  processResults(properties) {
    return Object.keys(properties)
      .sort((a, b) => properties[b].count - properties[a].count)
      .map(name => {
        const { count, type } = properties[name];
        return {count, type, name};
      });
  }
}

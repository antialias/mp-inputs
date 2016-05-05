import BaseQuery from './base';

export default class TopPropertiesQuery extends BaseQuery {
  buildUrl() {
    return 'api/2.0/events/properties/toptypes';
  }

  buildParams() {
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

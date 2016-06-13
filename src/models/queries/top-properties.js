import BaseQuery from './base';

export class TopEventPropertiesQuery extends BaseQuery {
  buildUrl() {
    return 'api/2.0/events/properties/toptypes';
  }

  buildParams() {
    return {limit: 255};
  }

  processResults(properties, resourceType='events') {
    return Object.keys(properties)
      .sort((a, b) => properties[b].count - properties[a].count)
      .map(name => {
        const { count, type } = properties[name];
        return {count, type, name, resourceType};
      });
  }
}

export class TopPeoplePropertiesQuery extends TopEventPropertiesQuery {
  buildUrl() {
    return 'api/2.0/engage/properties';
  }

  processResults(properties) {
    return super.processResults(properties.results, 'people');
  }
}

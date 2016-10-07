import BaseQuery from './base';

class BaseTopPropertiesQuery extends BaseQuery {
  buildParams() {
    return {limit: 255};
  }

  processResults(properties) {
    return Object.keys(properties)
      .sort((a, b) => properties[b].count - properties[a].count)
      .map(name => {
        const { count, type } = properties[name];
        return {count, type, name, resourceType: this.resourceType};
      });
  }
}

export class TopEventPropertiesQuery extends BaseTopPropertiesQuery {
  buildUrl() {
    return `api/2.0/events/properties/toptypes`;
  }

  get resourceType() {
    return `events`;
  }
}

export class TopPeoplePropertiesQuery extends BaseTopPropertiesQuery {
  buildUrl() {
    return `api/2.0/engage/properties`;
  }

  processResults(properties) {
    return super.processResults(properties.results);
  }

  get resourceType() {
    return `people`;
  }
}

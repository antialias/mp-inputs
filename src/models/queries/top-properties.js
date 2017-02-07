import { extend, sorted } from 'mixpanel-common/util';
import { renameProperty } from 'mixpanel-common/report/util';

import BaseQuery from './base';
import { PROPERTY_TYPES } from '../clause.js';

class BaseTopPropertiesQuery extends BaseQuery {
  buildParams() {
    return {limit: 255};
  }

  processResults(results) {
    const properties = Object.keys(results).map(name => {
      const { count, type } = results[name];
      return {count, type, name, resourceType: this.resourceType};
    }).filter(prop => PROPERTY_TYPES.includes(prop.type));
    // TODO: cassie investigate if we should be filtering these out or handling them better later

    return sorted(properties, {
      transform: prop => renameProperty(prop.name).toLowerCase(),
    });
  }
}

export class TopEventPropertiesQuery extends BaseTopPropertiesQuery {
  buildQuery(state) {
    const event = state.event;
    return event ? {event} : {};
  }

  buildUrl() {
    return `api/2.0/events/properties/toptypes`;
  }

  buildParams() {
    const params = super.buildParams();
    const event = this.query.event;

    return event ? extend(params, {event}) : params;
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

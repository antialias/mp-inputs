import { sorted } from 'mixpanel-common/util';

import BaseQuery from './base';

class BasePropertyValuesQuery extends BaseQuery {
  buildQuery(state) {
    let property = null;
    if (typeof state.stageClauses === `object` && state.stageClauses.length) {
      property = state.stageClauses[state.stageClauses.length - 1].value;
    }
    return {property};
  }
}

export class TopEventPropertyValuesQuery extends BasePropertyValuesQuery {
  buildUrl() {
    return `api/2.0/events/properties/values`;
  }

  buildParams() {
    return {name: this.query.property};
  }
}

export class TopPeoplePropertyValuesQuery extends BasePropertyValuesQuery {
  buildUrl() {
    return `api/2.0/engage/values`;
  }

  buildParams() {
    return {property: this.query.property};
  }

  processResults(results) {
    return sorted(results.results, {
      transform: value => value.toLowerCase(),
    });
  }
}

import BaseQuery from './base';

export class TopEventPropertyValuesQuery extends BaseQuery {
  buildQuery(state) {
    let property = null;
    if (typeof state.stageClauses === 'object' && state.stageClauses.length) {
      property = state.stageClauses[state.stageClauses.length - 1].value;
    }
    return {property};
  }

  buildUrl() {
    return 'api/2.0/events/properties/values';
  }

  buildParams() {
    return {name: this.query.property};
  }
}

export class TopPeoplePropertyValuesQuery extends TopEventPropertyValuesQuery {
  buildUrl() {
    return 'api/2.0/engage/values';
  }

  buildParams() {
    return {property: this.query.property};
  }

  processResults(results) {
    return results.results;
  }
}

import BaseQuery from './base';

export default class TopPropertyValuesQuery extends BaseQuery {
  buildQuery(state) {
    return {property: state.stageClause.value};
  }

  buildUrl() {
    return 'api/2.0/events/properties/values';
  }

  buildParams(query) {
    return {name: query.property};
  }
}

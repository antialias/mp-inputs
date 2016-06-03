import BaseQuery from './base';

export default class TopPropertyValuesQuery extends BaseQuery {
  buildQuery(state) {
    return {property: state.stageClause[state.stageClause.length - 1].value};
  }

  buildUrl() {
    return 'api/2.0/events/properties/values';
  }

  buildParams() {
    return {name: this.query.property};
  }
}

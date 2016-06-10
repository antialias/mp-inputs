import BaseQuery from './base';

export default class TopPropertyValuesQuery extends BaseQuery {
  buildQuery(state) {
    let property = null;
    if (typeof state.stageClause === 'object' && state.stageClause.length) {
      property = state.stageClause[state.stageClause.length - 1].value;
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

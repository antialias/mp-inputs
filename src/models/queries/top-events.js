import BaseQuery from './base';

export default class TopEventsQuery extends BaseQuery {
  buildUrl() {
    return `api/2.0/events/names`;
  }

  buildParams() {
    return {
      sort_fn: `desc`, // eslint-disable-line camelcase
      type: `general`,
      limit: 255,
    };
  }
}

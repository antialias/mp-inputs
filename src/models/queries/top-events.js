import BaseQuery from './base';

import queryMP from './api';

export default class TopEventsQuery extends BaseQuery {
  executeQuery() {
    return queryMP(`events/names`, window.API_SECRET, {
      sort_fn: `desc`, // eslint-disable-line camelcase
      type: `general`,
      limit: 100,
    });
  }
}

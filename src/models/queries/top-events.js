import { sorted } from 'mixpanel-common/util';
import { renameEvent } from 'mixpanel-common/report/util';

import BaseQuery from './base';

export default class TopEventsQuery extends BaseQuery {
  MPApiQuery() {
    return window.MP.api.topEvents({sort_fn: `desc`}); // eslint-disable-line camelcase
  }

  processResults(results) {
    return sorted(Object.values(results.values()), {
      transform: mpEvent => renameEvent(mpEvent).toLowerCase(),
    });
  }
}

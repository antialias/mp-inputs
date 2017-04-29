import { extend } from 'mixpanel-common/util';
import moment from 'moment';

import BaseQuery from './base';
import Result from '../result';
import { transformLeaves } from '../../util/chart';

export default class SegmentationQuery extends BaseQuery {
  buildUrl() {
    return `api/2.0/insights`;
  }

  buildQuery(state, displayOptions) {
    const query = state.report.toBookmarkData();
    query.displayOptions = extend(query.displayOptions, displayOptions);
    return query;
  }

  buildParams() {
    return {
      params: JSON.stringify(this.query),
    };
  }

  processResults(results) {
    // TEMP - While we support both old jql and new api backends, reconcile results
    //        format differences here. Updates to chart render code will be made
    //        in a separate refactor.

    results = new Result(results);
    results.series = transformLeaves(results.series, (key, val) => {
      const momentKey = moment(key, moment.ISO_8601, true);
      const timestampKey = momentKey.isValid() ? momentKey.valueOf() : null;
      return [timestampKey || key, val];
    });

    return results;
  }
}

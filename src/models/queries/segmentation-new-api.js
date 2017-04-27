import BaseQuery from './base';
import Result from '../result';

export default class SegmentationQuery extends BaseQuery {
  buildUrl() {
    return `api/2.0/insights`;
  }

  buildQuery(state) {
    return state.report.toBookmarkData();
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
    // TODO: transform results into suitable format for current chart code
    // TODO: transform all ISO date strings in results back to unix timestamps

    return results;
  }
}

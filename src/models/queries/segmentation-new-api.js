import { extend } from 'mixpanel-common/util';
import moment from 'moment';

import BaseQuery from './base';
import { Clause } from '../clause';
import Result from '../result';
import { rollbar } from '../../tracking';
import { transformLeaves } from '../../util/chart';

export default class SegmentationQuery extends BaseQuery {
  buildUrl() {
    return `api/2.0/insights`;
  }

  buildQuery(state, displayOptions) {
    const sections = state.report.sections;
    const isPeopleOnly = sections.show.clauses.every(clause =>
      clause.value.resourceType === Clause.RESOURCE_TYPE_PEOPLE
    );
    const propTypes = sections.group.clauses.map(clause => clause.propertyType);
    const isPeopleTimeSeries = isPeopleOnly && propTypes[propTypes.length - 1] === `datetime`;
    const query = state.report.toBookmarkData();

    query.displayOptions = extend(query.displayOptions, displayOptions);
    query.isPeopleTimeSeries = isPeopleTimeSeries;

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

    results.series = transformLeaves(results.series, (key, val) => {
      const momentKey = moment(key, moment.ISO_8601, true);
      const timestampKey = momentKey.isValid() ? momentKey.valueOf() : null;
      return [timestampKey || key, val];
    });
    results.peopleTimeSeries = this.query.isPeopleTimeSeries ? results.series : null;

    return new Result(results);
  }

  handleFetchError(error, url, params) {
    super.handleFetchError(...arguments);
    rollbar.error(`New Insights API RequestError`, {error, url, params});
  }
}
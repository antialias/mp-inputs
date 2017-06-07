import {extend} from 'mixpanel-common/util';
import moment from 'moment';

import BaseQuery from './base';
import {Clause} from '../clause';
import {SOURCE_DETAILS} from '../constants';
import Result from '../result';
import {rollbar} from '../../tracking';
import {transformLeaves} from '../../util/chart';

export default class SegmentationQuery extends BaseQuery {
  buildUrl() {
    return `api/2.0/insights`;
  }

  buildQuery(state, {displayOptions={}}={}) {
    const sections = state.report.sections;
    const isPeopleOnly = sections.show.clauses.every(clause =>
      clause.value.resourceType === Clause.RESOURCE_TYPE_PEOPLE
    );
    const propTypes = sections.group.clauses.map(clause => clause.propertyType);
    const isPeopleTimeSeries = isPeopleOnly && propTypes[propTypes.length - 1] === `datetime`;
    const query = state.report.toBookmarkData();

    // insights API takes determiner ("all" or "any") from the first filter clause
    if (sections.filter.determiner && query.sections.filter.length) {
      query.sections.filter[0].determiner = sections.filter.determiner;
    }

    // TODO @evnp - this won't work with filter determiner "any"; we'll have to add it in the read api
    const firstShowClause = query.sections.show[0];
    const profileType = firstShowClause.profileType;
    const profileTypeTable = profileType && SOURCE_DETAILS[profileType] && SOURCE_DETAILS[profileType].table;
    if (isPeopleOnly && profileType !== Clause.RESOURCE_TYPE_PEOPLE && profileTypeTable) {
      query.sections.filter.push({
        value: `Table`,
        resourceType: Clause.RESOURCE_TYPE_PEOPLE,
        filterType: `string`,
        filterOperator: `equals`,
        filterValue: profileTypeTable,
      });
    }

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

    results = results || {};

    results.series = transformLeaves(results.series, (key, val) => {
      // round numeric values to two decimal places
      if (typeof val === `number` && isFinite(val)) {
        val = Math.round(val * 100) / 100; // can't use toFixed because it returns string
      }

      // convert ISO-formatted time strings keys into unix timestamps
      const momentKey = moment(key, moment.ISO_8601, true);
      if (momentKey.isValid()) {
        // offset times by the diff between project and local timezone
        // to trick Highcharts into displaying data in project time
        const projectOffset = this.utcOffset;
        const localOffset = momentKey.utcOffset();
        momentKey.add(projectOffset - localOffset, `minutes`);

        const timestampKey = momentKey.valueOf();
        return [timestampKey, val];
      } else {
        return [key, val];
      }
    });

    results.peopleTimeSeries = this.query.isPeopleTimeSeries ? results.series : null;

    return new Result(results);
  }

  handleFetchError(error, url) {
    super.handleFetchError(...arguments);
    rollbar.error(`New Insights API RequestError`, {error, url, params: this.buildParams()});
  }
}

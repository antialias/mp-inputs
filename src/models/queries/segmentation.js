import { ShowClause } from '../clause';
import BaseQuery from './base';

export default class SegmentationQuery extends BaseQuery {
  buildQuery(state) {
    let events = state.sections.show.clauses
      .map(clause => clause.value);

    if (events.indexOf(ShowClause.TOP_EVENTS) !== -1) {
      events = state.topEvents.filter(event => event !== ShowClause.TOP_EVENTS);
    }

    const segments = state.sections.group.clauses
      .map(clause => clause.value);

    const filters = state.sections.filter.clauses
      .map(clause => [
        clause.value,
        clause.filterOperator,
        clause.filterValue
      ]);

    const time = state.sections.time.clauses[0];

    return {
      events,
      segments,
      filters,
      unit: time.unit,
      from: time.from,
      to: time.to,
    };
  }

  buildUrl(query) {
    let endpoint = 'events';

    if (query.events.length === 1 && query.segments.length) {
      endpoint = 'segmentation';

      if (query.segments.length > 1) {
        endpoint += '/multiseg';
      }
    }

    return `api/2.0/${endpoint}`;
  }

  buildParams(query) {
    const { events, segments, filters, unit, from, to } = query;
    let params = {unit, from, to, event: events};

    if (events.length === 1 && segments.length) {
      params.event = events[0];

      if (segments.length === 1) {
        params.on = `properties["${segments[0]}"]`;
      } else {
        params.outer = `properties["${segments[0]}"]`;
        params.inner = `properties["${segments[1]}"]`;
      }
    }

    if (filters.length) {
      params.where = filters.map(filter => {
        let [ property, type, value ] = filter;

        if (property && (
          value ||
          type === 'is set' ||
          type === 'is not set'
        )) {
          property = `(properties["${property}"])`;
          value = `"${value}"`;

          switch (type) {
            case 'equals'           : return `(${property} == ${value})`;
            case 'does not equal'   : return `(${property} != ${value})`;
            case 'contains'         : return `(${value} in ${property})`;
            case 'does not contain' : return `(${value} not in ${property})`;
            case 'is set'           : return `(defined ${property})`;
            case 'is not set'       : return `(not defined ${property})`;
          }
        }
      }).filter(Boolean).join(' and ');
    }

    return params;
  }

  processResults(results) {
    return results.data.values;
  }
}

import BaseQuery from './base';
import {
  FILTER_CONTAINS,
  FILTER_EQUALS,
  FILTER_NOT_CONTAINS,
  FILTER_NOT_EQUALS,
  FILTER_NOT_SET,
  FILTER_SET,
  RESOURCE_VALUE_TOP_EVENTS,
} from '../constants';

export default class SegmentationQuery extends BaseQuery {
  buildQuery(state) {
    let events = state.sections.show
      .map(clause => clause.value);

    if (events.indexOf(RESOURCE_VALUE_TOP_EVENTS) !== -1) {
      events = state.topEvents.filter(event => event !== RESOURCE_VALUE_TOP_EVENTS);
    }

    let segments = state.sections.group
      .map(clause => clause.value);

    let filters = state.sections.filter
      .map(clause => [
        clause.value,
        clause.filterType,
        clause.filterValue
      ]);

    let time = state.sections.time[0];

    return {
      events,
      segments,
      filters,
      unit: time.unit,
      from: time.range.from,
      to: time.range.to,
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
      function format() {
        return `(${Array.prototype.slice.call(arguments).join(' ')})`;
      }

      params.where = filters.map(filter => {
        let [ property, type, value ] = filter;

        if (property && (
          value ||
          type === FILTER_SET ||
          type === FILTER_NOT_SET
        )) {
          property = `(properties["${property}"])`;
          value = `"${value}"`;

          switch (type) {
            case FILTER_EQUALS       : return format(property, '==', value);
            case FILTER_NOT_EQUALS   : return format(property, '!=', value);
            case FILTER_CONTAINS     : return format(value, 'in', property);
            case FILTER_NOT_CONTAINS : return format(value, 'not in', property);
            case FILTER_SET          : return format('defined', property);
            case FILTER_NOT_SET      : return format('not defined', property);
          }
        }
      }).filter(filter => filter).join(' and ');
    }

    return params;
  }

  processResults(results) {
    return results.data.values;
  }
}

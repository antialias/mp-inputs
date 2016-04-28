import { ShowClause } from '../clause';
import BaseQuery from './base';

function isFilterValid(property, type, operator, value) {
  if (!property) {
    return false;
  }

  const isSetOrBoolean = ['is set', 'is not set', 'is true', 'is false'].indexOf(operator) !== -1;
  const isBetween = ['is between', 'was between'].indexOf(operator) !== -1;

  // filter must have a value UNLESS it is set or boolean
  if (!isSetOrBoolean && !value) {
    return false;
  }

  // between filter must have a value of length 2 with both entries present
  if (isBetween && (
    !value ||
    value.length !== 2 ||
    !value[0] ||
    !value[1]
  )) {
    return false;
  }

  return true;
}

function filterToArbSelectorString(property, type, operator, value) {
  property = `(properties["${property}"])`;

  if (typeof value === 'string') {
    value = `"${value}"`;
  } else if (Array.isArray(value)) {
    value = value.map(val => typeof val === 'string' ? `"${val}"` : val);
  }

  switch (type) {
    case 'string':
      if (operator === 'equals' || operator === 'does not equal') {
        if (!Array.isArray(value)) {
          value = [value];
        }
      }
      switch (operator) {
        case 'equals'           : return value.map(val => `(${property} == ${val})`).join(' or ');
        case 'does not equal'   : return value.map(val => `(${property} != ${val})`).join(' and ');
        case 'contains'         : return `(${value} in ${property})`;
        case 'does not contain' : return `(${value} not in ${property})`;
        case 'is set'           : return `(defined ${property})`;
        case 'is not set'       : return `(not defined ${property})`;
      }
    case 'number':
      switch (operator) {
        case 'is between'      : return `((${property} > ${value[0]}) and (${property} < ${value[1]}))`;
        case 'is equal to'     : return `(${property} == ${value})`;
        case 'is less than'    : return `(${property} < ${value})`;
        case 'is greater than' : return `(${property} > ${value})`;
      }
    case 'datetime':
      switch (operator) {
        case 'was less than' : return `(${property} < datetime(${new Date(new Date().getDate() - value).getTime()}))`;
        case 'was more than' : return `(${property} > datetime(${new Date(new Date().getDate() - value).getTime()}))`;
        case 'was on'        : return `((${property} >= datetime(${new Date(value.getTime()).setHours(0,0,0,0).getTime()})) and ` +
                                       `(${property} <= datetime(${new Date(value.getTime()).setHours(23,59,59,999).getTime()})))`;
        case 'was between'   : return `((${property} >= datetime(${new Date(value[0].getTime()).setHours(0,0,0,0).getTime()})) and ` +
                                       `(${property} <= datetime(${new Date(value[1].getTime()).setHours(23,59,59,999).getTime()})))`;
      }
    case 'boolean':
      switch (operator) {
        case 'is true'  : return `(boolean(${property}) == true)`;
        case 'is false' : return `(boolean(${property}) == false)`;
      }
    case 'list':
      switch (operator) {
        case 'contains'         : return `(${value} in list(${property}))`;
        case 'does not contain' : return `(${value} not in list(${property}))`;
      }
  }
}

export default class SegmentationQuery extends BaseQuery {
  buildQuery(state) {
    let events = state.sections.show.clauses
      .map(clause => clause.value);

    if (events.indexOf(ShowClause.TOP_EVENTS) !== -1) {
      events = state.topEvents
        .filter(event => event !== ShowClause.TOP_EVENTS)
        .slice(0, 50); // TODO remove this limit when we switch to JQL
    }

    const segments = state.sections.group.clauses
      .map(clause => clause.value);

    const filters = state.sections.filter.clauses
      .map(clause => [
        clause.value,
        clause.filterType,
        clause.filterOperator,
        clause.filterValue,
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

    const validFilters = filters.filter(filter => isFilterValid(...filter));

    if (validFilters.length) {
      params.where = validFilters
        .map(filter => filterToArbSelectorString(...filter))
        .join(' and ');
    }

    return params;
  }

  processResults(results) {
    return results.data.values;
  }
}

import BaseQuery from './base';
import { ShowClause } from '../clause';
import main from './segmentation.jql.js';

const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_DAY = MS_IN_HOUR * 24;
const MS_BY_UNIT = {
  hour: MS_IN_HOUR,
  day: MS_IN_DAY,
  week: MS_IN_DAY * 7,
  month: MS_IN_DAY * 30,
  quarter: MS_IN_DAY * 120,
  year: MS_IN_DAY * 365,
};

function isFilterValid(property, type, operator, value, dateUnit) {
  if (!property) {
    return false;
  }

  const isSetOrBoolean = ['is set', 'is not set', 'is true', 'is false'].indexOf(operator) !== -1;
  const isBetween = ['is between', 'was between'].indexOf(operator) !== -1;
  const isDaysAgo = type === 'datetime' && ['was more than', 'was less than'].indexOf(operator) !== -1;

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

  // days ago filter must have a value and a unit
  if (isDaysAgo && (!value || !dateUnit)) {
    return false;
  }

  return true;
}

// function filterToArbSelectorString(property, type, operator, value, dateUnit) {
//   property = `(properties["${property}"])`;

//   if (typeof value === 'string') {
//     value = `"${value}"`;
//   } else if (Array.isArray(value)) {
//     value = value.map(val => typeof val === 'string' ? `"${val}"` : val);
//   }

//   switch (type) {
//     case 'string':
//       if (operator === 'equals' || operator === 'does not equal') {
//         if (!Array.isArray(value)) {
//           value = [value];
//         }
//       }
//       switch (operator) {
//         case 'equals'           : return '(' + value.map(val => `(${property} == ${val})`).join(' or ') + ')';
//         case 'does not equal'   : return '(' + value.map(val => `(${property} != ${val})`).join(' and ') + ')';
//         case 'contains'         : return `(${value} in ${property})`;
//         case 'does not contain' : return `(${value} not in ${property})`;
//         case 'is set'           : return `(defined ${property})`;
//         case 'is not set'       : return `(not defined ${property})`;
//       }
//       break;
//     case 'number':
//       switch (operator) {
//         case 'is between'      : return `((${property} > ${value[0]}) and (${property} < ${value[1]}))`;
//         case 'is equal to'     : return `(${property} == ${value})`;
//         case 'is less than'    : return `(${property} < ${value})`;
//         case 'is greater than' : return `(${property} > ${value})`;
//       }
//       break;
//     case 'datetime': {
//       const unitMs = MS_BY_UNIT[dateUnit];

//       switch (operator) {
//         case 'was less than': return `(${property} < datetime(${new Date(new Date().getTime() - (value * unitMs)).getTime()}))`;
//         case 'was more than': return `(${property} > datetime(${new Date(new Date().getTime() - (value * unitMs)).getTime()}))`;
//         // TODO 'was on' should be a different case - when we have better date controls
//         case 'was on':
//         case 'was between': {
//           let from = new Date(value[0].getTime());
//           let to = new Date(value[1].getTime());

//           from.setHours(0, 0, 0, 0);
//           to.setHours(23, 59, 59, 999);

//           return `((${property} >= datetime(${from.getTime()})) and (${property} <= datetime(${to.getTime()})))`;
//         }
//       }
//       break;
//     }
//     case 'boolean':
//       switch (operator) {
//         case 'is true'  : return `(boolean(${property}) == true)`;
//         case 'is false' : return `(boolean(${property}) == false)`;
//       }
//       break;
//     case 'list':
//       switch (operator) {
//         case 'contains'         : return `(${value} in list(${property}))`;
//         case 'does not contain' : return `(not ${value} in list(${property}))`;
//       }
//       break;
//   }
// }

export default class SegmentationQuery extends BaseQuery {
  get valid() {
    return this.query.events && this.query.events.length;
  }

  buildQuery(state) {
    let events = state.sections.show.clauses
      .map(clause => clause.value);

    let type = ShowClause.MATH_TYPES[0];

    if (events.length) {
      type = state.sections.show.clauses[0].math;
    }

    // remap total -> general
    type = type === 'total' ? 'general' : type;

    if (events.includes(ShowClause.TOP_EVENTS)) {
      events = state.topEvents.filter(event => event !== ShowClause.TOP_EVENTS).slice(0, 12);
    }

    const segments = events.length > 1 ? [] :
      state.sections.group.clauses.map(clause => clause.value);

    const filters = state.sections.filter.clauses
      .map(clause => [
        clause.value,
        clause.filterType,
        clause.filterOperator,
        clause.filterValue,
        clause.filterDateUnit,
      ]);

    const time = state.sections.time.clauses[0];
    const unit = time.unit;
    let from = 0;
    let to = 0;

    if (Array.isArray(time.value)) {
      from = time.value[0] || 0;
      to = time.value[1] || 0;
    } else {
      from = time.value;
    }

    if (!(from instanceof Date)) {
      from = new Date(new Date().getTime() - (MS_BY_UNIT[unit] * from));
    }

    if (!(to instanceof Date)) {
      to = new Date(new Date().getTime() - (MS_BY_UNIT[unit] * to));
    }

    return {type, events, segments, filters, unit, from, to};
  }

  buildUrl() {
    return 'api/2.0/jql';
  }

  buildParams() {
    let scriptParams = {
      dates: {
        from: (new Date(this.query.from)).toISOString().split('T')[0],
        to:   (new Date(this.query.to)).toISOString().split('T')[0],
        unit: this.query.unit,
      },
      filters: [
        {
          condition: '==',
          expected: this.query.events,
        },
      ],
      groups: this.query.segments,
      // TMP
      validFilters: this.query.filters.filter(filter => isFilterValid(...filter)).length,
    };
    return {
      script: String(main),
      params: JSON.stringify(scriptParams),
    };


    // const { type, events, segments, filters, unit, from, to } = this.query;

    // let params = {unit, from, to, type, event: events};

    // if (events.length === 1 && segments.length) {
    //   params.event = events[0];

    //   if (segments.length === 1) {
    //     params.on = `properties["${segments[0]}"]`;
    //   } else {
    //     params.outer = `properties["${segments[0]}"]`;
    //     params.inner = `properties["${segments[1]}"]`;
    //   }
    // }

    // const validFilters = filters.filter(filter => isFilterValid(...filter));

    // if (validFilters.length) {
    //   params.where = validFilters
    //     .map(filter => filterToArbSelectorString(...filter))
    //     .join(' and ');
    // }

    // return params;
  }

  buildOptions() {
    return {type: 'POST'};
  }

  processResults(results) {
    let data = {};
    if (results) {
      data = results.reduce((h, p) => {
        h[p.key[0]] = h[p.key[0]] || {};
        h[p.key[0]][p.key[1]] = p.value;
        return h;
      }, {});
    }
    return {
      data,
      headers: this.query.segments,
    };
  }
}

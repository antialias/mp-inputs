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

function isFilterValid(filter) {
  if (!filter.value) {
    return false;
  }

  const isSetOrBoolean = ['is set', 'is not set', 'is true', 'is false'].includes(filter.filterOperator);
  const isBetween = ['is between', 'was between'].includes(filter.filterOperator);
  const isDaysAgo = filter.filterType === 'datetime' && ['was more than', 'was less than'].includes(filter.filterOperator);

  // filter must have a value UNLESS it is set or boolean
  if (!isSetOrBoolean && !filter.filterValue) {
    return false;
  }

  // between filter must have a value of length 2 with both entries present
  if (isBetween && (
    !filter.filterValue ||
    filter.filterValue.length !== 2 ||
    !filter.filterValue[0] ||
    !filter.filterValue[1]
  )) {
    return false;
  }

  // days ago filter must have a value and a unit
  if (isDaysAgo && (!filter.filterValue || !filter.filterDateUnit)) {
    return false;
  }

  return true;
}

function filterToParams(filter) {
  return {
    prop: filter.value,
    operator: filter.filterOperator,
    expected: filter.filterValue,
  };
}

      // .map(clause => [
      //   clause.value,
      //   clause.filterType,
      //   clause.filterOperator,
      //   clause.filterValue,
      //   clause.filterDateUnit,
      // ]);
// function filterToArbSelectorString(property, type, operator, value, dateUnit) {
//   property = `(properties["${property}"])`;

//   if (typeof value === 'string') {
//     value = `"${value}"`;
//   } else if (Array.isArray(value)) {
//     value = value.map(val => typeof val === 'string' ? `"${val}"` : val);
//   }

//   switch (type) {
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

    const filters = state.sections.filter.clauses.map(clause => clause.attrs);

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
          operator: 'equals',
          expected: this.query.events,
        },
      ]
        .concat(
          this.query.filters
          .filter(filter => isFilterValid(filter))
          .map(filter => filterToParams(filter))
        ),
      groups: this.query.segments,
    };
    return {
      script: String(main),
      params: JSON.stringify(scriptParams),
    };
  }

  buildOptions() {
    return {type: 'POST'};
  }

  processResults(results) {
    let data = {};
    if (results) {
      data = results.reduce((dataObj, item) => {
        // transform item.key array into nested obj,
        // with item.value at the deepest level
        let obj = dataObj;
        for (let si = 0; si < item.key.length - 1; si++) {
          let key = item.key[si];
          obj[key] = obj[key] || {};
          obj = obj[key];
        }
        obj[item.key[item.key.length - 1]] = item.value;
        return dataObj;
      }, {});
    }
    if (this.query.events.length === 1 && this.query.segments.length) {
      // special case segmentation on one event
      let ev = this.query.events[0];
      if (ev in data) {
        data = data[ev];
      }
    }
    return {
      data,
      headers: this.query.segments,
    };
  }
}

import BaseQuery from './base';
import { ShowClause } from '../clause';
import main from './segmentation.jql.js';
import { extend } from '../../util';

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
  const params = {
    prop: filter.value,
    dataType: filter.filterType,
    operator: filter.filterOperator,
    expected: filter.filterValue,
  };
  switch(params.dataType) {
    case 'datetime': {
      // add date params and convert from relative to absolute
      params.dateUnit = filter.filterDateUnit;
      const unitMS = MS_BY_UNIT[params.dateUnit];
      if (params.operator === 'was on') {
        // TODO de-hack once we have better UI
        params.operator = 'was between';
        params.expected[1] = params.expected[0];
      }
      if (params.operator === 'was between') {
        params.expected[0] = new Date(params.expected[0].getTime());
        params.expected[0].setHours(0, 0, 0, 0);
        params.expected[0] = new Date(params.expected[0].getTime());
        params.expected[1] = new Date(params.expected[1].getTime());
        params.expected[1].setHours(23, 59, 59, 999);
        params.expected[1] = new Date(params.expected[1].getTime());
      } else {
        params.expected = new Date(new Date().getTime() - (params.expected * unitMS)).getTime();
      }
      break;
    }
    case 'list':
      params.operator = `list ${params.operator}`;
      break;
  }
  return params;
}

export default class SegmentationQuery extends BaseQuery {
  constructor(customEvents) {
    super(...arguments);
    this.customEvents = customEvents;
  }

  get valid() {
    // only valid if one or more queries is prepared
    return !!this.query.eventQueries.length;
  }

  buildQuery(state) {
    // fire one query per show clause
    let eventQueries = state.sections.show.clauses.map(clause => {
      const ev = clause.value;
      if (ev.custom) {
        // TODO custom event
        return ev;
      } else {
        switch(ev.name) {
          case ShowClause.ALL_EVENTS.name:
            return [];
          case ShowClause.TOP_EVENTS.name:
            return state.topEvents.slice(0, 12);
          default:
            return [ev];
        }
      }
    });

    let type = ShowClause.MATH_TYPES[0];
    if (eventQueries.length) {
      type = state.sections.show.clauses[0].math;
    }

    // remap total -> general
    type = type === 'total' ? 'general' : type;

    const segments = state.sections.group.clauses.map(clause => clause.value);
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

    return {type, eventQueries, segments, filters, unit, from, to};
  }

  buildUrl() {
    return 'api/2.0/jql';
  }

  buildParams(eventData) {
    // base params
    let scriptParams = {
      dates: {
        from: (new Date(this.query.from)).toISOString().split('T')[0],
        to:   (new Date(this.query.to)).toISOString().split('T')[0],
        unit: this.query.unit,
      },
      filters:
        this.query.filters
          .filter(filter => isFilterValid(filter))
          .map(filter => filterToParams(filter)),
      groups: this.query.segments,
    };

    // insert events
    if (eventData.custom) {
      scriptParams.events = this.customEventToSelectors(eventData);
      scriptParams.customEventName = eventData.name;
    } else if (eventData.length === 0) {
      scriptParams.events = [];
      scriptParams.customEventName = ShowClause.ALL_EVENTS.name;
    } else {
      scriptParams.events = eventData.map(ev => ({event: ev.name}));
    }

    return {
      script: String(main),
      params: JSON.stringify(scriptParams),
    };
  }

  buildOptions() {
    return {type: 'POST'};
  }

  runQueries() {
    return this.query.eventQueries.map(events => window.MP.api.query(
      this.buildUrl(), this.buildParams(events), this.buildOptions()
    ));
  }

  executeQuery() {
    return Promise.all(this.runQueries()).then(resultSets => {
      return resultSets.reduce((acc, results) => acc.concat(results), []);
    });
  }

  processResults(results) {
    let headers = this.query.segments;
    let series = {};

    if (results) {
      series = results.reduce((seriesObj, item) => {
        // transform item.key array into nested obj,
        // with item.value at the deepest level
        let obj = seriesObj;
        for (let si = 0; si < item.key.length - 1; si++) {
          let key = item.key[si];
          obj[key] = obj[key] || {};
          obj = obj[key];
        }
        obj[item.key[item.key.length - 1]] = item.value;
        return seriesObj;
      }, {});
    }

    const queriedEventNames = this.query.eventQueries.reduce((acc, eventData) => {
      let names = [];
      if (eventData.custom) {
        names.push(eventData.name);
      } else if (eventData.length === 0) {
        names.push(ShowClause.ALL_EVENTS.name);
      } else {
        names.push(eventData.map(ev => ev.name));
      }
      return acc.concat(names);
    }, []);

    // For only one event or 'all events', which is also treated as one event in displaying for
    // groupBy, kill the top level group for the event name.
    if (queriedEventNames.length > 1 || !this.query.segments.length) {
      headers = ['$event'].concat(headers);
    }

    // special case segmentation on one event
    if (queriedEventNames.length === 1 && this.query.segments.length) {
      const evName = queriedEventNames[0];
      if (evName in series) {
        series = series[evName];
      }
    }
    return {series, headers};
  }

  // convert custom event data struct to format for JQL selectors:
  // [{event: 'foo', selector: 'bar'}, {event: 'foo', selector: 'bar'}]
  // including merging nested custom events
  customEventToSelectors(ce) {
    return ce.alternatives.reduce((selectors, ev) => {

      const selector = {
        event: ev.event,
        selector: ev.serialized,
      };
      let currentSelectors = [];

      const cidMatch = selector.event.match(/\$custom_event:(\d+)/);
      if (cidMatch) {
        // nested custom event
        const cid = Number(cidMatch[1]);
        let nestedCE = this.customEvents.find(c => c.id === cid);
        if (!nestedCE) {
          console.error(`No custom event with ID ${cid} found!`);
        } else {
          // merge nested CE's selectors with this one's
          let nestedSelectors = this.customEventToSelectors(nestedCE)
            .map(nestedSelector => extend(nestedSelector, {
              selector: [nestedSelector.selector, selector.selector].filter(Boolean).join(' and '),
            }));
          currentSelectors = currentSelectors.concat(nestedSelectors);
        }
      } else {
        // unnested
        currentSelectors.push(selector);
      }

      return selectors.concat(currentSelectors);
    }, []);
  }
}

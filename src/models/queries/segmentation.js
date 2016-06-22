import moment from 'moment';

import BaseQuery from './base';
import { ShowClause } from '../clause';
import main from './segmentation.jql.js';
import { extend, pick, renameEvent } from '../../util';

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
    resourceType: filter.resourceType,
    expected: filter.filterValue,
  };
  switch(params.dataType) {
    case 'datetime': {
      // add date params and convert from relative to absolute
      params.dateUnit = filter.filterDateUnit;
      const unitMS = MS_BY_UNIT[params.dateUnit];
      if (params.operator === 'was on') {
        // convert 'was on' to 'was between'
        params.operator = 'was between';
        params.expected = [params.expected, params.expected];
      }
      if (params.operator === 'was between') {
        params.expected = [
          Number(moment.utc(params.expected[0])),
          Number(moment.utc(params.expected[1]).add(1, 'day')) - 1,
        ];
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

class JQLQuery {
  constructor(showClause, state) {
    const ev = showClause.value;

    // insert events
    let events;
    if (ev.custom) {
      events = this.customEventToSelectors(ev);
    } else {
      switch(ev.name) {
        case ShowClause.ALL_EVENTS.name:
          events = [];
          break;
        case ShowClause.TOP_EVENTS.name:
          events = state.topEvents.slice(0, 12);
          break;
        default:
          events = [ev];
          break;
      }
      events = events.map(ev => ({event: ev.name}));
    }

    this.events = events;

    // Custom events and 'All Events' are a special case since they can't be used in the JQL
    // 'event_selectors' directly but we still want to track their display names.
    if (ev.custom || ev.name === ShowClause.ALL_EVENTS.name) {
      this.outputName = ev.name;
    }

    this.type = showClause.math;

    this.unit = state.sections.time.clauses[0].unit;
    if (['unique', 'average', 'median'].includes(this.type) && state.chartType !== 'line') {
      this.unit = 'all';
    }

    this.displayNames = {};
  }

  eventNames() {
    return this.outputName ? [this.outputName] : this.events.map(ev => ev.event);
  }
}

export default class SegmentationQuery extends BaseQuery {
  constructor(customEvents) {
    super(...arguments);
    this.customEvents = customEvents;
  }

  get valid() {
    // only valid if one or more queries is prepared
    return !!this.query.jqlQueries.length;
  }

  buildQuery(state) {
    // fire one query per show clause
    let jqlQueries = state.sections.show.clauses.map(showClause => new JQLQuery(showClause, state));

    // data global to all JQL queries.
    const segments = state.sections.group.clauses.map(clause => pick(clause, ['value', 'resourceType']));

    const filters = state.sections.filter.clauses.map(clause => clause.attrs);

    const time = state.sections.time.clauses[0];
    const unit = time.unit;

    let from, to;
    if (Array.isArray(time.value)) {
      [from, to] = time.value.map(ts => Number(moment.utc(ts)));
    } else {
      to = Number(moment.utc());
      from = to - MS_BY_UNIT[unit] * time.value;
    }

    return {jqlQueries, segments, filters, from, to};
  }

  buildUrl() {
    return 'api/2.0/jql';
  }

  buildParams(jqlQuery) {
    // base params
    let scriptParams = {
      events: jqlQuery.events,
      outputName: jqlQuery.outputName,
      dates: {
        from: (new Date(this.query.from)).toISOString().split('T')[0],
        to:   (new Date(this.query.to)).toISOString().split('T')[0],
        unit: jqlQuery.unit,
      },
      filters:
        this.query.filters
          .filter(filter => isFilterValid(filter))
          .map(filter => filterToParams(filter)),
      groups: this.query.segments,
      type: jqlQuery.type,
    };

    // As we need more helper data this should be moved down a level in the params
    scriptParams.needsPeopleData = scriptParams.filters.concat(scriptParams.groups).some(param => param.resourceType === 'people');

    return {
      script: String(main),
      params: JSON.stringify(scriptParams),
    };
  }

  buildOptions() {
    return {type: 'POST'};
  }

  preprocessNameConflicts() {
    let jqlQueries = this.query.jqlQueries;
    for (let i = 0; i < jqlQueries.length - 1; i++) {
      for (let j = i + 1; j < jqlQueries.length; j++) {
        jqlQueries[i].eventNames().forEach(name => {
          const names = jqlQueries[j].eventNames();
          if (names.includes(name)) {
            var index = jqlQueries.indexOf(jqlQueries[i]);
            jqlQueries[i].displayNames[name] = `${renameEvent(name)} (${jqlQueries[i].type.toUpperCase()}) #${index + 1}`;
            index = jqlQueries.indexOf(jqlQueries[j]);
            jqlQueries[j].displayNames[name] = `${renameEvent(name)} (${jqlQueries[j].type.toUpperCase()}) #${index + 1}`;
          }
        });
      }
    }
  }

  runQueries() {
    this.preprocessNameConflicts();
    return this.query.jqlQueries.map(jqlQuery => window.MP.api.query(
      this.buildUrl(), this.buildParams(jqlQuery), this.buildOptions()
    ));
  }

  executeQuery() {
    return Promise.all(this.runQueries()).then(resultSets => {
      return resultSets.reduce((acc, results, index) => {
        // resolve name conflicts
        results.forEach(result => {
          const displayName = this.query.jqlQueries[index].displayNames[result.key[0]];
          if (displayName) {
            result.key[0] = displayName;
          }
        });
        return acc.concat(results);
      }, []);
    });
  }

  processResults(results) {
    let headers = this.query.segments.map(segment => segment.value);
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

    const queriedEventNames = this.query.jqlQueries.reduce((acc, jqlQuery) => acc.concat(jqlQuery.eventNames()), []);

    // All Event is considered just a normal event in display.
    // When segmenting on only one event, don't display the top level names and header.
    if (Object.keys(series).length && queriedEventNames.length === 1 && this.query.segments.length > 0) {
      series = series[queriedEventNames[0]];
    }

    // Add the special $event header when not doing groupBy or when there is more than one event
    // name.
    if (queriedEventNames.length > 1 || this.query.segments.length === 0) {
      headers = ['$event'].concat(headers);
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

import moment from 'moment';

import BaseQuery from './base';
import { ShowClause } from '../clause';
import ExtremaJQLQuery from './extrema';
import Result from '../result';
import main from './segmentation.jql.js';
import QueryCache from './query-cache';

import {
  abbreviateNumber,
  capitalize,
  extend,
  MS_BY_UNIT,
  parseDate,
  pick,
  renameEvent,
  renameProperty,
} from '../../util';

export function toArbSelectorPropertyToken(resourceType, property) {
  return `${resourceType === `events` ? `properties` : `user`}["${property}"]`;
}

function isFilterValid(filter) {
  if (!filter.value) {
    return false;
  }

  const isSetOrBoolean = [`is set`, `is not set`, `is true`, `is false`].includes(filter.filterOperator);
  const isBetween = [`is between`, `was between`].includes(filter.filterOperator);
  const isRelativeDate = filter.filterType === `datetime` &&
    [`was more than`, `was less than`, `was in`].includes(filter.filterOperator);

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

  // relative date filter must have a value and a unit
  if (isRelativeDate && (!filter.filterValue || !filter.filterDateUnit)) {
    return false;
  }

  return true;
}

function filterToArbSelectorString(filter) {
  let property = filter.value;
  const type = filter.filterType;
  const operator = filter.filterOperator;
  let value = filter.filterValue;
  const dateUnit = filter.filterDateUnit;

  property = `(${toArbSelectorPropertyToken(filter.resourceType, property)})`;

  if (typeof value === `string`) {
    value = `"${value}"`;
  } else if (Array.isArray(value)) {
    value = value.map(val => typeof val === `string` ? `"${val}"` : val);
  }

  switch (type) {
    case `string`:
      if (operator === `equals` || operator === `does not equal`) {
        if (!Array.isArray(value)) {
          value = [value];
        }
      }
      switch (operator) {
        case `equals`           : return `(` + value.map(val => `(${property} == ${val})`).join(` or `) + `)`;
        case `does not equal`   : return `(` + value.map(val => `(${property} != ${val})`).join(` and `) + `)`;
        case `contains`         : return `(${value} in ${property})`;
        case `does not contain` : return `(not ${value} in ${property})`;
        case `is set`           : return `(defined ${property})`;
        case `is not set`       : return `(not defined ${property})`;
      }
      break;
    case `number`:
      switch (operator) {
        case `is between`      : return `((${property} > ${value[0]}) and (${property} < ${value[1]}))`;
        case `is equal to`     : return `(${property} == ${value})`;
        case `is less than`    : return `(${property} < ${value})`;
        case `is greater than` : return `(${property} > ${value})`;
      }
      break;
    case `datetime`: {
      const unitsAgo = units => new Date().getTime() - (units * MS_BY_UNIT[dateUnit]);
      const startOfDay = date => parseDate(date, {startOfDay: true}).getTime();
      const endOfDay = date => parseDate(date, {endOfDay: true}).getTime();

      const lessThan = timestamp => `(${property} < datetime(${timestamp}))`;
      const moreThan = timestamp => `(${property} > datetime(${timestamp}))`;
      const between = (from, to) =>
        `((${property} >= datetime(${startOfDay(from)})) and (${property} <= datetime(${endOfDay(to)})))`;

      switch (operator) {
        case `was in the`:
        case `was less than` : return lessThan(unitsAgo(value));
        case `was more than` : return moreThan(unitsAgo(value));
        case `was before`    : return lessThan(startOfDay(value));
        case `was after`     : return moreThan(endOfDay(value));
        case `was on`        : return between(value, value);
        case `was between`   : return between(...value);
      }
      break;
    }
    case `boolean`:
      switch (operator) {
        case `is true`  : return `(boolean(${property}) == true)`;
        case `is false` : return `(boolean(${property}) == false)`;
      }
      break;
    case `list`:
      switch (operator) {
        case `contains`         : return `(${value} in list(${property}))`;
        case `does not contain` : return `(not ${value} in list(${property}))`;
      }
      break;
  }
}

class JQLQuery {
  constructor(showClause, state, options={}) {
    this.chartType = options.chartType || state.report.displayOptions.chartType;
    this.customEvents = options.customEvents || [];

    this.type = showClause.math;
    this.property = (showClause.property && pick(showClause.property, [`name`, `resourceType`])) || null;
    this.resourceType = showClause.value.resourceType || `events`;
    this.displayNames = {};

    if (this.resourceType === `events`) {
      // event query
      const ev = showClause.value;
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

      this.custom = ev.custom;
      this.events = events;

      // Custom events and 'All Events' are a special case since they can't be used in the JQL
      // 'event_selectors' directly but we still want to track their display names.
      if (ev.custom || ev.name === ShowClause.ALL_EVENTS.name) {
        this.outputName = ev.name;
      }

      this.unit = state.report.sections.time.clauses[0].unit;
      if ([`min`, `max`, `unique`, `average`, `median`].includes(this.type) && this.chartType !== `line`) {
        this.unit = `all`;
      }
    } else {
      // people query
      this.outputName = showClause.property && showClause.property.name || showClause.value.name;
      if (!this.property) {
        this.type = ShowClause.MATH_TYPE_TOTAL;
      }
    }
  }

  eventNames() {
    return this.outputName ? [this.outputName] : this.events.map(ev => ev.event);
  }

  displayName(name) {
    const operation = this.type;

    const isEventQuery = this.resourceType === ShowClause.RESOURCE_TYPE_EVENTS;
    name = isEventQuery ? renameEvent(name) : renameProperty(name);
    let display;
    if (this.property) {
      const onEvent = isEventQuery ? ` on ${name}` : ``;
      display = `${operation} of ${renameProperty(this.property.name)}${onEvent}`;
    } else {
      display = `${operation} number of ${name}`;
    }

    return capitalize(display);
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
              selector: [nestedSelector.selector, selector.selector].filter(Boolean).join(` and `),
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

export default class SegmentationQuery extends BaseQuery {
  constructor() {
    super(...arguments);
    this.extremaCache = new QueryCache();
  }

  get valid() {
    // only valid if one or more queries is prepared
    return !!this.query.jqlQueries.length;
  }

  buildQuery(state, options) {
    const sections = state.report.sections;

    // fire one query per show clause
    let jqlQueries = sections.show.clauses.map(
      showClause => new JQLQuery(showClause, state, extend(options, pick(this, [`customEvents`])))
    );

    // data global to all JQL queries.
    const segments = sections.group.clauses.map(clause => pick(clause, [`value`, `propertyType`, `resourceType`, `typeCast`]));

    const filterArbSelectors = sections.filter.clauses
      .map(clause => clause.attrs)
      .filter(filter => isFilterValid(filter))
      .map(filter => filterToArbSelectorString(filter))
      .join(` and `);

    const time = sections.time.clauses[0];
    const unit = time.unit;

    let from, to;
    if (Array.isArray(time.value)) {
      [from, to] = time.value.map(ts => Number(moment.utc(ts)));
    } else {
      to = Number(moment.utc());
      from = to - MS_BY_UNIT[unit] * time.value;
    }

    return {jqlQueries, segments, filterArbSelectors, from, to};
  }

  buildUrl() {
    return `api/2.0/jql`;
  }

  buildGroups() {
    this.resetBucketRanges();
    let eventsToQuery = this.allEventsInAllQueries();
    return Promise.all(this.query.segments.map((segment, idx) => new Promise(resolve => {
      const segmentType = segment.typeCast || segment.propertyType;
      if (segmentType === `number`) {
        if (this.query.filterArbSelectors) {
          eventsToQuery = eventsToQuery.map(event => {
            const selector = event.selector ? `(${event.selector} and ${this.query.filterArbSelectors})` : this.query.filterArbSelectors;
            return extend(event, {selector});
          });
        }

        const state = {
          from: new Date(this.query.from),
          to: new Date(this.query.to),
          events: eventsToQuery,
          isPeopleProperty: segment.resourceType === `people`,
          property: segment.value,
        };
        const extremaQuery = new ExtremaJQLQuery({
          apiHost: this.apiHost,
          apiSecret: this.apiSecret,
        });
        const builtExtremaQuery = extremaQuery.build(state);
        const cachedExtremaQuery = this.extremaCache.get(builtExtremaQuery.query);
        builtExtremaQuery.run(cachedExtremaQuery).then(result => {
          this.extremaCache.set(builtExtremaQuery.query, result, 120);
          this.storeBucketRange(idx, result.bucketRanges);
          return resolve(extend(segment, {buckets: result.buckets}));
        });
      } else {
        return resolve(segment);
      }
    })));
  }

  buildJQLParams(jqlQuery) {
    // prepare JQL params for one JQL query.
    return this.buildGroups(jqlQuery).then(groups => {
      // base params
      const scriptParams = {
        // filter clauses are global to all show clauses.
        outputName: jqlQuery.outputName,
        groups,
        type: jqlQuery.type,
        property: jqlQuery.property,
      };

      if (jqlQuery.events) {
        scriptParams.dates = {
          from: (new Date(this.query.from)).toISOString().split(`T`)[0],
          to:   (new Date(this.query.to)).toISOString().split(`T`)[0],
          unit: jqlQuery.unit,
        };
        scriptParams.selectors = jqlQuery.events.map(selector => {
          if (selector.selector) {
            if (this.query.filterArbSelectors) {
              selector.selector += ` and ${this.query.filterArbSelectors}`;
            }
          } else {
            selector.selector = this.query.filterArbSelectors;
          }
          return selector;
        });
      } else {
        if (this.query.filterArbSelectors) {
          scriptParams.selectors = [{selector: this.query.filterArbSelectors}];
        }
        if (groups && groups.length && groups[groups.length - 1].propertyType === `datetime`) {
          scriptParams.peopleTimeSeriesOnProperty = `properties.${scriptParams.groups.pop().value}`;
          console.log(scriptParams.peopleTimeSeriesOnProperty);
        }
      }

      if (groups.length) {
        scriptParams.groupLimits = [-1].concat(groups.map(() => 100));
      }

      // As we need more helper data this should be moved down a level in the params
      const hasPeopleFilters = groups.concat([scriptParams.property])
        .some(param => param && param.resourceType === `people`);
      const hasUserSelectors = scriptParams.selectors && scriptParams.selectors
        .some(es => es.selector && es.selector.includes(`user[`));
      const needsPeopleData = hasPeopleFilters || hasUserSelectors|| jqlQuery.resourceType === `people`;
      let resourceTypeNeeded = needsPeopleData ? `people` : `events`;
      if (jqlQuery.events && needsPeopleData) {
        resourceTypeNeeded = `all`;
      }
      scriptParams.resourceTypeNeeded = resourceTypeNeeded;
      return scriptParams;
    });
  }

  buildParams(scriptParams) {
    return {
      script: String(main),
      params: JSON.stringify(scriptParams),
    };
  }

  preprocessNameConflicts() {
    let jqlQueries = this.query.jqlQueries;
    for (let i = 0; i < jqlQueries.length - 1; i++) {
      for (let j = i + 1; j < jqlQueries.length; j++) {
        jqlQueries[i].eventNames().forEach(name => {
          const names = jqlQueries[j].eventNames();
          if (names.includes(name)) {
            var displayNameI = jqlQueries[i].displayName(name);
            var displayNameJ = jqlQueries[j].displayName(name);

            if (displayNameI === displayNameJ) {
              displayNameI += ` #${jqlQueries.indexOf(jqlQueries[i]) + 1}`;
              displayNameJ += ` #${jqlQueries.indexOf(jqlQueries[j]) + 1}`;
            }

            jqlQueries[i].displayNames[name] = displayNameI;
            jqlQueries[j].displayNames[name] = displayNameJ;
          }
        });
      }
    }
  }

  buildJQLArgs() {
    // prepare args for each JQL Query.
    this.preprocessNameConflicts();
    return this.query.jqlQueries.map(jqlQuery =>
      this.buildJQLParams(jqlQuery).then(jqlParams =>
        [this.buildUrl(), this.buildParams(jqlParams), this.buildOptions()]));
  }

  runJQLQueries() {
    return this.buildJQLArgs().map(args => args.then(args => this.fetch(...args)));
  }

  executeQuery() {
    return Promise.all(this.runJQLQueries()).then(resultSets => {
      return resultSets.reduce((acc, results, index) => {
        // resolve name conflicts
        const outputName = this.query.jqlQueries[index].outputName;
        results.forEach(result => {
          const displayName = this.query.jqlQueries[index].displayNames[result.key[0]];
          if (displayName) {
            result.key[0] = displayName;
          }
          if (outputName) {
            result.key.unshift(outputName);
          }
        });
        return acc.concat(results);
      }, []);
    });
  }

  processResults(results) {
    let headers = this.query.segments.map(segment => segment.value);
    let series = {};

    // create an object of zero values for all possible dates
    let baseDateResults = {};
    const isPeopleOnlyQuery = this.query.jqlQueries.every(query => query.resourceType === `people`);

    const dateKeyCache = {};
    const getDateKey = epoch => {
      if (!dateKeyCache[epoch]) {
        dateKeyCache[epoch] = moment.utc(epoch).format();
      }
      return dateKeyCache[epoch];
    };

    if (!isPeopleOnlyQuery) {
      results.forEach(r => baseDateResults[getDateKey(r.key[r.key.length - 1])] = 0);
    }
    if (results) {
      series = results.reduce((seriesObj, item) => {
        // transform item.key array into nested obj,
        // with item.value at the deepest level
        if (isPeopleOnlyQuery) {
          item.key.push(`value`);
        }

        let obj = seriesObj;
        for (let si = 0; si < item.key.length - 1; si++) {
          let key = item.key[si];
          if (si && this.isBucketedAtSegmentIdx(si - 1)) {
            key = this.formattedKeyForBucketedSegment(si - 1, key);
          }
          // If it is the second to last key it must be the object holding the date values.
          // If it does not yet exist fill this with the zeroed-out base dates.
          if (si === item.key.length - 2 && !obj[key]) {
            obj[key] = extend(baseDateResults);
          } else {
            obj[key] = obj[key] || {};
          }
          obj = obj[key];
        }

        obj[getDateKey(item.key[item.key.length - 1])] = item.value;
        return seriesObj;
      }, {});
    }

    headers = [isPeopleOnlyQuery ? `$people` : `$event`].concat(headers);

    return new Result({series, headers});
  }

  allEventsInAllQueries() {
    return this.query.jqlQueries.reduce((total, query) => total.concat(query.events), []);
  }

  // bucketed segment helpers

  formattedKeyForBucketedSegment(segmentIdx, key) {
    if (typeof key === `number`) {
      const ranges = this._bucketRanges[segmentIdx][key];
      return `${abbreviateNumber(ranges[0])} - ${abbreviateNumber(ranges[1])}`;
    } else {
      return key;
    }

  }

  isBucketedAtSegmentIdx(idx) {
    return this.hasBucketedSegments && !!this._bucketRanges[idx];
  }

  resetBucketRanges() {
    this.hasBucketedSegments = false;
    this._bucketRanges = {};
  }

  storeBucketRange(segmentIdx, bucketRanges) {
    this.hasBucketedSegments = true;
    this._bucketRanges[segmentIdx] = bucketRanges;
  }
}

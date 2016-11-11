import moment from 'moment';

import BaseQuery from './base';
import ExtremaQuery from './extrema';
import { ShowClause } from '../clause';
import Result from '../result';
import main from './segmentation.jql.js';
import {
  abbreviateNumber,
  capitalize,
  extend,
  pick,
  renameEvent,
  renameProperty,
} from '../../util';

const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_DAY = MS_IN_HOUR * 24;
export const MS_BY_UNIT = {
  hour: MS_IN_HOUR,
  day: MS_IN_DAY,
  week: MS_IN_DAY * 7,
  month: MS_IN_DAY * 30,
  quarter: MS_IN_DAY * 120,
  year: MS_IN_DAY * 365,
};

export function toArbSelectorPropertyToken(resourceType, property) {
  return `${resourceType === `events` ? `properties` : `user`}["${property}"]`;
}

function isFilterValid(filter) {
  if (!filter.value) {
    return false;
  }

  const isSetOrBoolean = [`is set`, `is not set`, `is true`, `is false`].includes(filter.filterOperator);
  const isBetween = [`is between`, `was between`].includes(filter.filterOperator);
  const isDaysAgo = filter.filterType === `datetime` && [`was more than`, `was less than`].includes(filter.filterOperator);

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

function filterToArbSelectorString(filter) {
  let property = filter.value;
  const type = filter.filterType;
  const operator = filter.filterOperator;
  let value = filter.filterValue;
  const dateUnit = filter.dateUnit;

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
      const unitMs = MS_BY_UNIT[dateUnit];

      const between = (from, to) => {
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        return `((${property} >= datetime(${from.getTime()})) and (${property} <= datetime(${to.getTime()})))`;
      };

      switch (operator) {
        case `was less than`: return `(${property} < datetime(${new Date().getTime() - (value * unitMs)}))`;
        case `was more than`: return `(${property} > datetime(${new Date().getTime() - (value * unitMs)}))`;
        case `was on`: return between(new Date(value), new Date(value));
        case `was between`: return between(new Date(value[0]), new Date(value[1]));
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

    this.custom = ev.custom;
    this.events = events;

    // Custom events and 'All Events' are a special case since they can't be used in the JQL
    // 'event_selectors' directly but we still want to track their display names.
    if (ev.custom || ev.name === ShowClause.ALL_EVENTS.name) {
      this.outputName = ev.name;
    }

    this.type = showClause.math;

    this.unit = state.report.sections.time.clauses[0].unit;
    if ([`min`, `max`, `unique`, `average`, `median`].includes(this.type) && this.chartType !== `line`) {
      this.unit = `all`;
    }

    this.property = (showClause.property && pick(showClause.property, [`name`, `resourceType`])) || null;

    this.displayNames = {};
  }

  eventNames() {
    return this.outputName ? [this.outputName] : this.events.map(ev => ev.event);
  }

  displayName(name) {
    const operation = this.type;
    const event = renameEvent(name);
    let display;
    if (this.property) {
      display = `${operation} of ${renameProperty(this.property.name)} on ${event}`;
    } else {
      display = `${operation} number of ${event}`;
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
  constructor(customEvents) {
    super(...arguments);
    this.customEvents = customEvents;
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
    const segments = sections.group.clauses.map(clause => pick(clause, [`value`, `resourceType`, `filterType`]));

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

  buildGroups(jqlQuery) {
    // Check all numeric property groupBys. When a group clause is a numeric property, do an extrema
    // query asynchronously to get its cardinality information. JQL code will use it to create
    // special groupby functions to create buckets to avoid doing high-cardinality groupbys. For all
    // other cases, return (resolve) right away.
    this.resetBucketRanges();
    return Promise.all(this.query.segments.map((segment, idx) => new Promise(resolve => {
      if (segment.filterType === `number`) {
        let eventName;
        if (jqlQuery.custom) {
          eventName = jqlQuery.outputName;
        } else if (jqlQuery.events.length === 1) {
          eventName = jqlQuery.eventNames()[0];
        } else {
          // Don't support getting extrema on the same property of multiple events *in the same
          // show clause* for now. This means using 'Top Events' with a high-cardinality groupBy can
          // still freeze the browser. Alternatively, we can call extrema for all 12 top events and
          // get an universal bucketing scheme, but this gets crazy for 'All Events'.

          // Or, we can take advantage of 'Group By Limits' in JQL 2.0.
          return resolve(segment);
        }
        const action = segment.resourceType === `people` ? `user` : `properties`;
        let extremaQuery = new ExtremaQuery();
        let state = {
          /* eslint-disable camelcase */
          from: new Date(this.query.from),
          to: new Date(this.query.to),
          event: eventName,
          on: `${action}["${segment.value}"]`,
          where: this.query.filterArbSelectors,
          allow_more_buckets: false,
          allow_fewer_buckets: true,
          buckets: 12,
          /* eslint-enable camelcase */
        };
        state.interval = (state.to.getTime() - state.from.getTime()) / MS_BY_UNIT.day + 1;
        extremaQuery.build(state).run().then(result => {
          let buckets = {};
          if (result.buckets) {
            this.storeBucketRange(idx, result.bucketRanges);
            buckets = result.buckets;
          }
          return resolve(extend(segment, {buckets}));
        });
      } else {
        resolve(segment);
      }
    })));
  }

  buildJQLParams(jqlQuery) {
    // prepare JQL params for one JQL query.
    return this.buildGroups(jqlQuery).then(groups => {
      // base params
      const scriptParams = {
        // filter clauses are global to all show clauses.
        selectors: jqlQuery.events.map(selector => {
          if (selector.selector) {
            if (this.query.filterArbSelectors) {
              selector.selector += ` and ${this.query.filterArbSelectors}`;
            }
          } else {
            selector.selector = this.query.filterArbSelectors;
          }
          return selector;
        }),
        outputName: jqlQuery.outputName,
        dates: {
          from: (new Date(this.query.from)).toISOString().split(`T`)[0],
          to:   (new Date(this.query.to)).toISOString().split(`T`)[0],
          unit: jqlQuery.unit,
        },
        groups: groups,
        type: jqlQuery.type,
        property: jqlQuery.property,
      };

      // As we need more helper data this should be moved down a level in the params
      const hasPeopleFilters = scriptParams.groups.concat([scriptParams.property])
        .some(param => param && param.resourceType === `people`);
      const hasUserSelectors = scriptParams.selectors
        .some(es => es.selector && es.selector.includes(`user[`));
      scriptParams.needsPeopleData = hasPeopleFilters || hasUserSelectors;

      return scriptParams;
    });
  }

  buildParams(scriptParams) {
    return {
      script: String(main),
      params: JSON.stringify(scriptParams),
    };
  }

  buildOptions() {
    return {type: `POST`};
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
    return this.buildJQLArgs().map(args => args.then(args => window.MP.api.query(...args)));
  }

  executeQuery() {
    return Promise.all(this.runJQLQueries()).then(resultSets => {
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

    // create an object of zero values for all possible dates
    let baseDateResults = {};
    results.forEach(r => baseDateResults[r.key[r.key.length-1]] = 0);

    if (results) {
      series = results.reduce((seriesObj, item) => {
        // transform item.key array into nested obj,
        // with item.value at the deepest level
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
      headers = [`$event`].concat(headers);
    }
    return new Result({series, headers});
  }

  // bucketed segment helpers

  formattedKeyForBucketedSegment(segmentIdx, key) {
    const ranges = this._bucketRanges[segmentIdx][key];
    return `${abbreviateNumber(ranges[0])} - ${abbreviateNumber(ranges[1])}`;
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

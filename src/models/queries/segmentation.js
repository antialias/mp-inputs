import moment from 'moment';

import BaseQuery from './base';
import { GroupClause, ShowClause } from '../clause';
import { FilterSection } from '../section';
import ExtremaJQLQuery from './extrema';
import Result from '../result';
import main from './segmentation.jql.js';
import QueryCache from './query-cache';

import {
  abbreviateNumber,
  capitalize,
  createBaseResults,
  extend,
  filterToArbSelectorString,
  formatDate,
  isFilterValid,
  localizedDate,
  offsetTimestampWithDst,
  pick,
  renameEvent,
  renameProperty,
} from '../../util';
import {
  cacheParsedDate,
} from '../../util/chart';

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
    this.timestampToDateStringCache = {};
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
    const segments = sections.group.clauses
      .map(clause => pick(clause, [`value`, `propertyType`, `resourceType`, `typeCast`, `unit`]))
      .map(clause => clause.value === GroupClause.EVENT_DATE.name ? extend(clause, {isEventDate: true}) : clause);

    const conjunction = sections.filter.determiner === FilterSection.DETERMINER_ANY ? `or` : `and`;
    const filterArbSelectors = sections.filter.clauses
      .map(clause => clause.attrs)
      .filter(filter => isFilterValid(filter))
      .map(filter => filterToArbSelectorString(filter))
      .join(` ${conjunction} `);

    const isPeopleOnly = jqlQueries.every(query => query.resourceType === `people`);
    const lastPeopleSegment = isPeopleOnly && segments.length && segments[segments.length - 1];
    const isPeopleTimeSeries = lastPeopleSegment && lastPeopleSegment.propertyType === `datetime`;

    const time = sections.time.clauses[0];
    const unit = isPeopleTimeSeries ? lastPeopleSegment.unit : time.unit;

    let fromMoment, toMoment;
    if (Array.isArray(time.value)) {
      // Defined dates -- Selected calendar days in project time
      [fromMoment, toMoment] = time.value.map(datestring => moment.utc(datestring));
    } else {
      // Relative dates -- Last X days are relative to local time (as if you were in the project time)
      toMoment = moment(localizedDate({utcOffset: this.utcOffset}));
      fromMoment = moment(toMoment).subtract(time.value - 1, `${unit}s`);
    }

    // from day should start at the beginning of the unit chosen (with the smallest being day)
    const remapStartDateByUnit = {
      hour: `day`,
      week: `isoweek`, // Monday first weeks
    };

    return {
      filterArbSelectors,
      isPeopleOnly,
      isPeopleTimeSeries,
      jqlQueries,
      segments,
      unit,
      from: fromMoment.startOf(remapStartDateByUnit[unit] || unit).valueOf(),
      to: toMoment.valueOf(),
    };
  }

  buildUrl() {
    return `api/2.0/jql`;
  }

  escapeDots(property) {
    // escape '.' to '\.'
    return property && property.replace(`\.`, `\\.`);
  }

  buildGroups() {
    this.resetBucketRanges();
    let eventsToQuery = this.allEventsInAllQueries();
    return Promise.all(this.query.segments.map((segment, idx) => new Promise(resolve => {
      const segmentType = segment.typeCast || segment.propertyType;
      if (segmentType === `number`) {
        const params = {
          from: new Date(this.query.from),
          to: new Date(this.query.to),
          isPeopleProperty: segment.resourceType === `people`,
          property: segment.value,
          selectors: eventsToQuery,
        };

        if (this.query.filterArbSelectors) {
          if (eventsToQuery.length) {
            params.selectors = eventsToQuery.map(event => {
              const selector = event.selector ? `(${event.selector} and ${this.query.filterArbSelectors})` : this.query.filterArbSelectors;
              return extend(event, {selector});
            });
          } else {
            params.selectors = [{selector: this.query.filterArbSelectors}];
          }
        }

        const extremaQuery = new ExtremaJQLQuery({
          apiHost: this.apiHost,
          apiSecret: this.apiSecret,
          accessToken: this.accessToken,
          projectId: this.projectId,
        });
        const builtExtremaQuery = extremaQuery.build(params);
        const cachedExtremaQuery = this.extremaCache.get(builtExtremaQuery.query);
        builtExtremaQuery.run(cachedExtremaQuery).then(result => {
          this.extremaCache.set(builtExtremaQuery.query, result, 120);
          this.storeBucketRange(idx, result.bucketRanges);
          // escape after the extrema query
          return resolve(extend(segment, {buckets: result.buckets, value: this.escapeDots(segment.value)}));
        });
      } else {
        return resolve(extend(segment, {value: this.escapeDots(segment.value)}));
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

      if (scriptParams.property) {
        scriptParams.property.name = this.escapeDots(scriptParams.property.name);
      }

      if (jqlQuery.events) {
        scriptParams.dates = {
          from: (new Date(this.query.from)).toISOString().split(`T`)[0],
          to:   (new Date(this.query.to)).toISOString().split(`T`)[0],
          unit: jqlQuery.unit,
        };
        if (jqlQuery.events.length) {
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
        } else if (this.query.filterArbSelectors) {
          // include arbselectors for $all_events
          scriptParams.selectors = [{selector: this.query.filterArbSelectors}];
        }
      } else {
        if (this.query.filterArbSelectors) {
          scriptParams.selectors = [{selector: this.query.filterArbSelectors}];
        }
      }

      if (groups.length) {
        scriptParams.groupLimits = [-1].concat(groups.map(() => 100));
      }

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
        const jqlQuery = this.query.jqlQueries[index];
        // resolve name conflicts
        const outputName = jqlQuery.outputName;
        results.forEach(result => {
          const displayName = jqlQuery.displayNames[result.key[0]];
          if (displayName) {
            result.key[0] = displayName;
          }

          // When filtering segmentation query by property,
          // `event - property` should be used so user can see meaningful names in charts
          if (this.isEventPropertyQuery(jqlQuery) && result.key.length > 1) {
            result.key[0] = `${renameEvent(result.key[0])} - ${renameProperty(jqlQuery.property.name)}`;
          }

          if (outputName) {
            result.key.unshift(outputName);
          }

          if (typeof result.value === `number` && isFinite(result.value) && result.value > 1) {
            result.value = Math.round(result.value);
          }
        });
        return acc.concat(results);
      }, []);
    });
  }

  isEventPropertyQuery(jqlQuery) {
    return jqlQuery.property && jqlQuery.property.name && jqlQuery.resourceType === `events`;
  }

  processResults(results) {
    const querySegments = this.query.segments;
    let headers = querySegments.map(segment => segment.value);
    let series = {};
    let peopleTimeSeries = null;
    const isEventsQuery = !this.query.isPeopleOnly;

    if (results) {
      // create base date values for all known dates if anything but non-time people query.
      let baseDateResults = {};
      if (isEventsQuery || this.query.isPeopleTimeSeries) {

        // LOCALIZING RESULTS
        // TODO move to util + add tests
        // Results are returned as a timestamp with no timezone but in the date + time of the project timezone. For example,
        // if an event happened on Mar 27 2017 14:00:00 GMT-0700 (PDT) the event is returned from the query with a
        // datetime of Mar 27 2017 14:00:00 GMT+00 (UTC). We want to display the results as if the local machine is in UTC.
        // To accomplish this, we subtract the local utcOffset.
        const localizeTimestamp = timestamp => offsetTimestampWithDst(moment(timestamp).subtract(moment().utcOffset(), `minutes`).valueOf());
        results = results.map(({key, value}) => {
          let originalTimestamp = key[key.length - 1];
          if (!originalTimestamp) {
            return null;
          }

          if (this.query.isPeopleTimeSeries) {
            // Datetime properties are returned in seconds.
            // Since people time series queries are just groupBys on a date property we need to convert to MS.
            originalTimestamp = originalTimestamp * 1000;
          }

          // subtract the local utcOffset to that we maintain the exact date + time regardless of the default UTC timezone
          const localizedTimestamp = localizeTimestamp(originalTimestamp);
          return {
            key: key.slice(0, -1).concat(localizedTimestamp), // account for DST if applicable
            value,
          };
        }).filter(Boolean);

        const baseDateParams = {unit: this.query.unit};
        if (isEventsQuery) {
          // from dates always start at the beginning of the day
          baseDateParams.fromDate = moment(localizeTimestamp(this.query.from)).startOf(`day`).valueOf();

          let toDate = moment(localizeTimestamp(this.query.to));
          const projectTimeNow = moment(localizedDate({utcOffset: this.utcOffset}));
          if (toDate.diff(projectTimeNow, `days`) === 0) {
            // if the to date is the same day as the project times current day only go up until the project timezone time
            toDate = projectTimeNow;
          } else {
            // if it is not the same day, go until the end of the selected day
            toDate = toDate.endOf(`day`);
          }
          baseDateParams.toDate = toDate.valueOf();
        }
        baseDateResults = createBaseResults(results, baseDateParams);
      }

      const isSegDatetime = idx => querySegments[idx].propertyType === `datetime`;
      const unitsForDatetimeSet = idx => ({
        unit: querySegments[idx].unit,
        timestampMultiplier: querySegments[idx].isEventDate ? 1 : 1000,
      });

      const createSeriesReducerFunc = ({isTimeSeries=true}={}) => {
        return (seriesObj, item) => {
          // transform item.key array into nested obj,
          // with item.value at the deepest level
          if (!isTimeSeries) {
            item = extend(item, {key: item.key.concat(`value`)});
          }

          let obj = seriesObj;
          for (let si = 0; si < item.key.length - 1; si++) {
            let key = item.key[si];

            // conditional key formatting
            const segIdx = si - 1;
            if (si && Number.isInteger(key) && isSegDatetime(segIdx)) {
              key = this.formattedKeyForDateSegment(key, unitsForDatetimeSet(segIdx));
            } else if (si && this.isBucketedAtSegmentIdx(segIdx)) {
              key = this.formattedKeyForBucketedSegment(segIdx, key);
            }


            // If it is the second to last key it must be the object holding the date values.
            // If it does not yet exist fill this with the zeroed-out base dates.
            if (si === item.key.length - 2 && !obj[key]) {
              obj[key] = isTimeSeries ? extend(baseDateResults) : {};
            } else {
              obj[key] = obj[key] || {};
            }
            obj = obj[key];
          }

          let label = item.key[item.key.length - 1];
          label = Number.isInteger(Number(label)) ? label : `value`;
          obj[label] = item.value;
          return seriesObj;
        };
      };

      series = results.reduce(createSeriesReducerFunc({isTimeSeries: !this.query.isPeopleOnly}), {});
      peopleTimeSeries = this.query.isPeopleTimeSeries ? results.reduce(createSeriesReducerFunc(), {}) : null;
    }

    headers = [this.query.isPeopleOnly ? `$people` : `$event`].concat(headers);

    return new Result({series, headers, peopleTimeSeries});
  }

  allEventsInAllQueries() {
    return this.query.jqlQueries.reduce((total, query) => (query.events ? total.concat(query.events) : total), []);
  }

  // date timestamps of properties come back in seconds. 10^3 is needed to bring it to ms for moment.
  formattedKeyForDateSegment(timestamp, {unit=`day`, timestampMultiplier=1000}={}) {
    this.timestampToDateStringCache[unit] = this.timestampToDateStringCache[unit] || {};

    const timestampInMS = timestamp * timestampMultiplier;
    const dateString = this.timestampToDateStringCache[unit][timestampInMS] || formatDate(timestampInMS, {
      unit,
      utc: true,
      customFormatting: {day: `MMM D 'YY`},
    });

    this.timestampToDateStringCache[unit][timestampInMS] = dateString;
    cacheParsedDate(dateString, timestampInMS);

    return dateString;
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

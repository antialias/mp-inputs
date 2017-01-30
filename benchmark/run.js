import os from 'os';
import Mixpanel from 'mixpanel';
import fetch from 'node-fetch';

import BuilderSections from '../src/models/builder-sections';
import { ShowClause, TimeClause, GroupClause } from '../src/models/clause';
import { ShowSection, TimeSection, GroupSection } from '../src/models/section';
import { MS_BY_UNIT, toArbSelectorPropertyToken } from '../src/models/queries/segmentation';
import SegmentationQuery from '../src/models/queries/segmentation';

import { API_BASE, authHeader, urlencodeParams } from './util';
import QUERIES from './queries';

const DEBUG = (process.env.DEBUG || '').toLowerCase() === 'true';
const PASSES = Number(process.env.PASSES || 3);
const SEGMENTATION_API_BASE = `${API_BASE}/api/2.0/segmentation`;

const all = Promise.all.bind(Promise);
const debugLog = function() {
  if (DEBUG) {
    console.log(...arguments);
  }
}

// track to IRB project
const mixpanel = Mixpanel.init('2fd54f3085a7b7d70da94096fc415078');

function buildIRBQuery(queryParams) {
  debugLog('Building query for params:', queryParams);
  const irbQuery = new SegmentationQuery({
    apiHost: API_BASE,
    apiSecret: queryParams.apiSecret,
  }, {customEvents: []});
  const state = {
    report: {
      displayOptions: {chartType: 'line'},
      sections: new BuilderSections({
        show: new ShowSection(...queryParams.queries.map(q =>
          new ShowClause({
            math: q.type,
            value: {name: q.events[0]},
            property: q.property,
          })
        )),
        time: new TimeSection(new TimeClause({range: queryParams.time.range})),
      }),
    },
  };
  const groups = queryParams.groups;
  if (groups) {
    state.report.sections.group = new GroupSection(...groups.map(g => new GroupClause(g)));
  }
  debugLog(state.report.sections.show);
  debugLog(state.report.sections.group);
  irbQuery.query = irbQuery.buildQuery(state);
  debugLog(irbQuery.query);
  return irbQuery;
}

function timeJQLQueries(queryParams) {
  return buildIRBQuery(queryParams).buildJQLArgs().map(queryArgs => queryArgs.then(queryArgs => {
    const [url, params, options] = queryArgs;
    debugLog(params.params);    // JQL params
    return timeQuery(`${API_BASE}/${url}`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'x-www-form-urlencoded',
        'Authorization': authHeader(queryParams.apiSecret),
      },
      method: 'POST',
      body: urlencodeParams(params),
    });
  }));
}

function timeSegQueries(queryParams) {
  return buildIRBQuery(queryParams).buildJQLArgs().map(queryArgs => queryArgs.then(queryArgs => {
    const irbParams = JSON.parse(queryArgs[1].params);
    const params = {
      event: irbParams.selectors[0].event,
      from_date: irbParams.dates.from,
      to_date: irbParams.dates.to,
      type: 'general',
      unit: irbParams.dates.unit,
    };
    debugLog(irbParams);        // IRB params
    let url = SEGMENTATION_API_BASE;
    const groups = irbParams.groups;
    if (irbParams.property && groups.length > 0) {
      console.error('Segmentation only supports operators on numeric properties with no groupBys.');
      process.exit(1);
    }

    switch (groups.length) {
      case 0:
        if (irbParams.property) {
          if (['unique', 'median'].includes(irbParams.type)) {
            console.error(`Segmentation does not support ${irbParams.type} for numeric properties.`);
            process.exit(1);
          }
          const property = irbParams.property;
          Object.assign(params, {
            on: `number(${toArbSelectorPropertyToken(property.resourceType, property.name)})`,
            limit: 150,
            buckets: 12,
            allow_more_buckets: false,
          });

          const type = irbParams.type === 'total' ? 'sum' : irbParams.type;
          url = `${url}/${type}`;
        }
        break;
      case 1:
        Object.assign(params, {
          on: toArbSelectorPropertyToken(groups[0].resourceType, groups[0].value),
          limit: 150,
        });
        if (groups[0].filterType === 'number') {
          url = `${url}/numeric`;
        }
        break;
      case 2:
        Object.assign(params, {
          outer: toArbSelectorPropertyToken(groups[0].resourceType, groups[0].value),
          inner: toArbSelectorPropertyToken(groups[1].resourceType, groups[1].value),
          limit: 25,
        });
        if (groups[0].filterType === 'number') {
          params.outer_modifer = 'numeric';
        }
        if (groups[1].filterType === 'number') {
          params.inner_modifer = 'numeric';
        }
        if (groups[0].filterType === 'number' || groups[1].filterType === 'number') {
          Object.assign(params, {
            buckets: 12,
            allow_more_buckets: false,
          });
        }
        url = `${url}/multiseg`;
        break;
      default:
        console.error("At most 2 levels of groupBys is supported by Segmentation.");
        process.exit(1);
    }
    debugLog(params);           // segmentation params
    return timeQuery(`${url}?${urlencodeParams(params)}`, {
      headers: {'Authorization': authHeader(queryParams.apiSecret)},
    });
  }));
}

async function timeQuery(url, params) {
  const start = new Date();
  debugLog(url);
  const responseData = await (await fetch(url, params)).json();

  process.stdout.write('.');
  debugLog(responseData);
  responseData.data && debugLog(responseData.data.values); // segmentation values
  if (responseData.error) {
    console.error(responseData);
    process.exit(1);
  }

  return new Date() - start;
}

function processResults(results, qtype, qi) {
  const mss = results[qtype].map(res => res[qi]).filter(time => time !== null);
  return {
    avg: mss.length ? Math.round(mss.reduce((sum, n) => sum + n) / mss.length) : null,
    raw: mss,
  };
}

const rightPad = (s, len) => s + Array(len - s.length).fill(' ').join('');

(async () => {
  try {
    const table = [
      ['Project', 'Query', 'JQL', 'Seg', 'Raw JQL', 'Raw Seg'],
    ];

    for (const query of QUERIES) {
      const results = {
        jql: [],
        seg: [],
      };

      // get timings in multiple passes
      for (let pass = 0; pass < PASSES; pass++) {
        results.jql.push(query.disableForJQL ? [null] : await all(timeJQLQueries(query)));
        results.seg.push(query.disableForSeg ? [null] : await all(timeSegQueries(query)));
      }

      // process results and add to table
      for (let qi = 0; qi < results.jql[0].length; qi++) {
        const processed = {
          seg: processResults(results, 'seg', qi),
          jql: processResults(results, 'jql', qi),
        }
        table.push([
          String(query.project), query.name,
          String(processed.jql.avg), String(processed.seg.avg),
          processed.jql.raw.join(','), processed.seg.raw.join(','),
        ]);

        for (const queryType of ['jql', 'seg']) {
          debugLog(processed[queryType].avg);
          mixpanel.track('Benchmark query', {
            'Avg latency ms': processed[queryType].avg,
            'Passes': PASSES,
            'Project ID': query.project,
            'Query name': query.name,
            'Query type': queryType,
            'Simultaneous queries': query.queries.length,
            'Host name': os.hostname(),
          });
        }
      }
    }
    process.stdout.write('\n\n');

    // output results
    const zip = (...rows) => rows[0].map((_, i) => rows.map(row => row[i]));

    const columnMaxWidths = zip(...table).map(column => Math.max(...column.map(c => c.length)));

    for (const row of table) {
      console.log(row.map((s, i) => rightPad(s, columnMaxWidths[i])).join('   '));
    }
  } catch(e) {
    console.error(e.stack);
    process.exit(1);
  }
})();

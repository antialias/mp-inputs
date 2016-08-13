import './MPApiStub';

import os from 'os';
import Mixpanel from 'mixpanel';
import fetch from 'node-fetch';

import BuilderSections from '../src/models/builder-sections';
import { ShowClause, TimeClause, GroupClause } from '../src/models/clause';
import { ShowSection, TimeSection, GroupSection } from '../src/models/section';
import { MS_BY_UNIT } from '../src/models/queries/segmentation';
import SegmentationQuery from '../src/models/queries/segmentation';

import QUERIES from './queries';

const API_BASE = process.env.API_BASE || 'https://mixpanel.com';
const SEGMENTATION_API_BASE = `${API_BASE}/api/2.0/segmentation`;
const DEBUG = (process.env.DEBUG || '').toLowerCase() === 'true';
const PASSES = Number(process.env.PASSES || 3);

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
  const irbQuery = new SegmentationQuery([]);
  const state = {
    report: {
      displayOptions: { chartType: 'line' },
      sections: new BuilderSections({
        show: new ShowSection(...queryParams.queries.map(q =>
          new ShowClause({
            math: q.type,
            value: {name: q.events[0]},
          })
        )),
        time: new TimeSection(new TimeClause({range: queryParams.time.range})),
      }),
    },
  };
  const groups = queryParams.group;
  if (groups) {
    state.report.sections.group = new GroupSection(groups.map(g => new GroupClause(g)));
  }
  irbQuery.query = irbQuery.buildQuery(state);
  return irbQuery;
}

function authHeader(queryParams) {
  return `Basic ${new Buffer(queryParams.apiSecret + ':', 'binary').toString('base64')}`;
}

function urlencodeParams(params) {
  return Object.keys(params)
    .reduce((items, pkey) => items.concat(`${pkey}=${encodeURIComponent(params[pkey])}`), [])
    .join('&');
}

function timeJQLQueries(queryParams) {
  return buildIRBQuery(queryParams).buildJQLArgs().map(queryArgs => queryArgs.then(queryArgs => {
    const [url, params, options] = queryArgs;
    return timeQuery(`${API_BASE}/${url}`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'x-www-form-urlencoded',
        'Authorization': authHeader(queryParams),
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
      type: irbParams.type == 'total' ? 'general' : irbParams.type,
      unit: irbParams.dates.unit,
    };
    return timeQuery(`${SEGMENTATION_API_BASE}?${urlencodeParams(params)}`, {
      headers: {'Authorization': authHeader(queryParams)},
    });
  }));
}

async function timeQuery(url, params) {
  const start = new Date();
  const responseData = await (await fetch(url, params)).json();

  process.stdout.write('.');
  debugLog(responseData);
  if (responseData.error) {
    console.error(responseData);
    process.exit(1);
  }

  return new Date() - start;
}

function processResults(results, qtype, qi) {
  const mss = results[qtype].map(res => res[qi]);
  return {
    avg: Math.round(mss.reduce((sum, n) => sum + n) / mss.length),
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

      // inject apiSecret into global context
      global.MP.apiSecret = query.apiSecret;

      // get timings in multiple passes
      for (let pass = 0; pass < PASSES; pass++) {
        results.jql.push(await all(timeJQLQueries(query)));
        results.seg.push(await all(timeSegQueries(query)));
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

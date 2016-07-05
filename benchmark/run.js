import fetch from 'node-fetch';

import BuilderSections from '../src/models/builder-sections';
import { ShowClause, TimeClause } from '../src/models/clause';
import { ShowSection, TimeSection } from '../src/models/section';
import { MS_BY_UNIT } from '../src/models/queries/segmentation';
import SegmentationQuery from '../src/models/queries/segmentation';

import QUERIES from './queries';

const API_BASE = process.env.API_BASE || 'https://mixpanel.com';
const PASSES = Number(process.env.PASSES || 3);
const DEBUG = (process.env.DEBUG || '').toLowerCase() === 'true';

const all = Promise.all.bind(Promise);
const debugLog = function() {
  if (DEBUG) {
    console.log(...arguments);
  }
}

function buildIRBQuery(queryParams) {
  debugLog('Building query for params:', queryParams);
  const irbQuery = new SegmentationQuery([]);
  irbQuery.query = irbQuery.buildQuery({
    report: {
      chartType: 'line',
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
  });
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
  return buildIRBQuery(queryParams).buildJQLArgs().map(queryArgs => {
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
  });
}

function timeSegQueries(queryParams) {
  const irbQueryParams = buildIRBQuery(queryParams).buildJQLArgs().map(a => a[1].params);
  return queryParams.queries.map((query, qi) => {
    const irbParams = JSON.parse(irbQueryParams[qi]);
    const params = {
      event: query.events[0],
      from_date: irbParams.dates.from,
      to_date: irbParams.dates.to,
      type: query.type || 'general',
      unit: irbParams.dates.unit,
    };
    return timeQuery(`${API_BASE}/api/2.0/segmentation?${urlencodeParams(params)}`, {
      headers: {'Authorization': authHeader(queryParams)},
    });
  });
}

async function timeQuery(url, params) {
  const start = new Date();
  try {
    const responseText = await (await fetch(url, params)).text();

    process.stdout.write('.');
    debugLog(responseText);
  } catch(e) {
    console.error(e);
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
      ['JQL', 'Seg', 'Raw JQL', 'Raw Seg'],
    ];

    for (const query of QUERIES) {
      const results = {
        jql: [],
        seg: [],
      };

      // get timings in multiple passes
      for (let pass = 0; pass < PASSES; pass++) {
        results.jql.push(await all(timeJQLQueries(query)));
        results.seg.push(await all(timeSegQueries(query)));
      }

      // process results and add to table
      for (let qi = 0; qi < results.jql[0].length; qi++) {
        let seg = processResults(results, 'seg', qi);
        let jql = processResults(results, 'jql', qi);
        table.push([String(jql.avg), String(seg.avg), jql.raw.join(','), seg.raw.join(',')]);
      }
    }
    process.stdout.write('\n\n');

    // output results
    const colWidth = Math.max(...table.map(row => Math.max(...row.map(s => s.length))));
    for (const row of table) {
      console.log(row.map(s => rightPad(s, colWidth)).join('   '));
    }
  } catch(e) {
    console.error(e);
  }
})();

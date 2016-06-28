import fetch from 'node-fetch';

import BuilderSections from '../src/models/builder-sections';
import { ShowClause, TimeClause } from '../src/models/clause';
import { ShowSection, TimeSection } from '../src/models/section';
import { MS_BY_UNIT } from '../src/models/queries/segmentation';
import SegmentationQuery from '../src/models/queries/segmentation';

import QUERIES from './queries';

const API_BASE = 'https://mixpanel.com';
const all = Promise.all.bind(Promise);

function buildIRBQuery(queryParams) {
  const irbQuery = new SegmentationQuery([]);
  irbQuery.query = irbQuery.buildQuery({
    sections: new BuilderSections({
      show: new ShowSection(...queryParams.queries.map(q =>
        new ShowClause({value: {name: q.events[0]}})
      )),
      time: new TimeSection(new TimeClause({range: queryParams.time.range})),
    }),
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
    await (await fetch(url, params)).text();
  } catch(e) {
    console.error(e);
  }
  return new Date() - start;
}

(async () => {
  try {
    for (const query of QUERIES) {
      const jqlResults = await all(timeJQLQueries(query));
      const segResults = await all(timeSegQueries(query));
      console.log('jqlResults:', jqlResults);
      console.log('segResults:', segResults);
    }
  } catch(e) {
    console.error(e);
  }
})();

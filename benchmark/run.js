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
      time: new TimeSection(new TimeClause({range: queryParams.range})),
    }),
  });
  return irbQuery;
}

function timeJQLQueries(query) {
  return buildIRBQuery(query).buildJQLArgs().map(queryArgs => {
    const [url, params, options] = queryArgs;
    return timeQuery(`${API_BASE}/${url}`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'x-www-form-urlencoded',
        'Authorization': `Basic ${new Buffer(query.apiSecret + ':', 'binary').toString('base64')}`,
      },
      method: 'POST',
      body: Object.keys(params).reduce((items, pkey) =>
        items.concat(`${pkey}=${encodeURIComponent(params[pkey])}`),
      []).join('&'),
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
      const results = await all(timeJQLQueries(query));
      console.log('results:', results);
    }
  } catch(e) {
    console.error(e);
  }
})();

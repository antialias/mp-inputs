import fetch from 'node-fetch';

import BuilderSections from '../src/models/builder-sections';
import { ShowClause, TimeClause } from '../src/models/clause';
import { ShowSection, TimeSection } from '../src/models/section';
import { MS_BY_UNIT } from '../src/models/queries/segmentation';
import SegmentationQuery from '../src/models/queries/segmentation';

const API_BASE = 'https://mixpanel.com';

const irbQuery = new SegmentationQuery([]);
irbQuery.query = irbQuery.buildQuery({
  sections: new BuilderSections({
    show: new ShowSection(new ShowClause({value: 'Viewed report'})),
    time: new TimeSection(new TimeClause({range: TimeClause.RANGES.MONTH})),
  }),
});

async function makeQueries(postArgs) {
  const results = await Promise.all(postArgs.map(queryArgs => {
    const [url, params, options] = queryArgs;
    const fullURL = `${API_BASE}/${url}`;
    return fetchResponse(fullURL);
  }));
  return results;
}

async function fetchResponse(url) {
  let text;
  try {
    const res = await fetch(url);
    text = await res.text();
  } catch(e) {
    console.error(e);
  }
  return text;
}

(async () => {
  const results = await makeQueries(irbQuery.buildJQLArgs());
  console.log('results:', results);
})();

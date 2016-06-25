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
    show: new ShowSection(
      new ShowClause({value: 'Viewed report'}),
      new ShowClause({value: 'Segmentation query'})
    ),
    time: new TimeSection(new TimeClause({range: TimeClause.RANGES.MONTH})),
  }),
});

function timeJQLQueries(postArgs) {
  return Promise.all(postArgs.map(queryArgs => {
    const [url, params, options] = queryArgs;
    const fullURL = `${API_BASE}/${url}`;
    return timeQuery(fullURL);
  }));
}

async function timeQuery(url) {
  const start = new Date();
  try {
    await (await fetch(url)).text();
  } catch(e) {
    console.error(e);
  }
  return new Date() - start;
}

(async () => {
  try {
    const results = await timeJQLQueries(irbQuery.buildJQLArgs());
    console.log('results:', results);
  } catch(e) {
    console.error(e);
  }
})();

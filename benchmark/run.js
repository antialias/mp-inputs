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

const postArgs = irbQuery.buildJQLArgs();
for (const queryArgs of postArgs) {
  const [url, params, options] = queryArgs;
  const fullURL = `${API_BASE}/${url}`;
  fetch(fullURL).then(res => res.text()).then(body => console.log(body));
}

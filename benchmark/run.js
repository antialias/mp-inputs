import BuilderSections from '../src/models/builder-sections';
import { ShowClause, TimeClause } from '../src/models/clause';
import { ShowSection, TimeSection } from '../src/models/section';
import { MS_BY_UNIT } from '../src/models/queries/segmentation';
import SegmentationQuery from '../src/models/queries/segmentation';

const irbQuery = new SegmentationQuery([]);
irbQuery.query = irbQuery.buildQuery({
  sections: new BuilderSections({
    show: new ShowSection(new ShowClause({value: 'Viewed report'})),
    time: new TimeSection(new TimeClause({range: TimeClause.RANGES.MONTH})),
  }),
});

console.log('args', irbQuery.buildJQLArgs());

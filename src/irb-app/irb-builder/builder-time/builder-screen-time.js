import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import { extend } from '../../../util';

import template from './builder-screen-time.jade';
import './builder-screen-time.styl';

const RANGE_ITEMS = TimeClause.RANGE_LIST.map(name => ({name}));

document.registerElement(`builder-screen-time`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        RANGES: TimeClause.RANGES,
        availableRanges: () => this.matchingItems(RANGE_ITEMS),
        clickedRange: range => {
          if (range.name === TimeClause.RANGES.CUSTOM) {
            this.nextScreen(`builder-screen-time-custom`);
          } else {
            this.updateAndCommitStageClause({range: range.name});
          }
        },
      }),
    };
  }
});

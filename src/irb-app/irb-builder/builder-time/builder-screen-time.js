import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import { extend } from '../../../util';

import template from './builder-screen-time.jade';
import './builder-screen-time.styl';

document.registerElement(`builder-screen-time`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        RANGES: TimeClause.RANGES,
        RANGE_LIST: TimeClause.RANGE_LIST,
        isRangeSelected: range => {
          const selectedRange = this.helpers.getStageClauseAttr(`range`);
          return range === selectedRange || (
            !selectedRange && range === TimeClause.RANGES.CUSTOM
          );
        },
        clickedRange: range => {
          if (range === TimeClause.RANGES.CUSTOM) {
            this.nextScreen(`builder-screen-time-custom`);
          } else {
            this.updateAndCommitStageClause({range});
          }
        },
      }),
    };
  }
});

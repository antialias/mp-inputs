import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import { extend } from '../../../util';
import { MS_BY_UNIT } from '../../../util/time';

import template from './builder-screen-time.jade';
import './builder-screen-time.styl';

const RANGE_ITEMS = TimeClause.RANGE_LIST.map(name => ({name}));
const RANGE_INFO = TimeClause.RANGE_TO_VALUE_AND_UNIT;
const RANGES = TimeClause.RANGES;

document.registerElement(`builder-screen-time`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        RANGES: TimeClause.RANGES,
        availableRanges: () =>  {
          return RANGE_ITEMS.map(RANGE => {
            if (RANGE.name === RANGES.CUSTOM) {
              RANGE.upsell = false;
            } else {
              const optionMS = RANGE_INFO[RANGE.name].value * MS_BY_UNIT[RANGE_INFO[RANGE.name].unit];
              const dataHistoryMS = this.app.getFeatureGateValue(`max_data_history_days`) * MS_BY_UNIT[`day`];
              RANGE.upsell = optionMS >= dataHistoryMS;
            }
            return RANGE;
          });
        },
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

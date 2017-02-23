import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import { extend } from '../../../util';
import { MS_BY_UNIT } from '../../../util/time';

import template from './builder-screen-time.jade';
import './builder-screen-time.styl';

const RANGE_ITEMS = TimeClause.RANGE_LIST.map(name => ({name}));
const RANGE_INFO = TimeClause.RANGE_TO_VALUE_AND_UNIT;
const RANGES = TimeClause.RANGES;
const TIME_CUSTOM_SCREEN_WIDTH = 534;

document.registerElement(`builder-screen-time`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        RANGES: TimeClause.RANGES,
        availableRanges: () => {
          const dataHistoryMS = this.app.maxDataHistoryDays() * MS_BY_UNIT[`day`];
          const featureGatedOptions = RANGE_ITEMS.map((range, index) => {
            if (range.name === RANGES.CUSTOM) {
              range.upsell = false;
            } else {
              const optionMS = RANGE_INFO[range.name].value * MS_BY_UNIT[RANGE_INFO[range.name].unit];
              range.upsell = optionMS >= dataHistoryMS;
            }
            return extend(range, {index});
          });

          return this.matchingItems(featureGatedOptions);
        },
        clickedRange: range => {
          if (range.upsell) {
            this.app.openUpsellModal(`timeClause`);
            return;
          }
          if (range.name === TimeClause.RANGES.CUSTOM) {
            const position = this.getBoundingClientRect();
            const willCrossViewportEdge = window.innerWidth - position.left < TIME_CUSTOM_SCREEN_WIDTH;
            this.nextScreen(`builder-screen-time-custom`, {alignTimeCustomPaneRight: willCrossViewportEdge});
          } else {
            this.updateAndCommitStageClause({range: range.name});
          }
        },
      }),
    };
  }

});

import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import { extend, MS_BY_UNIT } from '../../../util';

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
          const featureGatedOptions = RANGE_ITEMS.map(range => {
            if (range.name === RANGES.CUSTOM) {
              range.upsell = false;
            } else {
              const optionMS = RANGE_INFO[range.name].value * MS_BY_UNIT[RANGE_INFO[range.name].unit];
              range.upsell = optionMS >= dataHistoryMS;
            }
            return range;
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
            this.nextScreen(`builder-screen-time-custom`, {
              screenAttrs: {alignTimeCustomPaneRight: willCrossViewportEdge},
            });
            this.app.updateBuilder({fromFocused: true, toFocused: false});
          } else {
            this.updateAndCommitStageClause({range: range.name});
          }
        },
      }),
    };
  }

});

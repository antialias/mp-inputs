import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import {
  extend,
  formatDateISO,
  relativeToAbsoluteDate,
  unitForDateRange,
} from '../../../util';

import template from './builder-screen-time-custom.jade';
import './builder-screen-time-custom.styl';

import '../../widgets/datepicker';

const UNITS = TimeClause.TIME_UNIT_LIST.filter(
  choice => choice !== TimeClause.TIME_UNITS.YEAR
);

document.registerElement(`builder-screen-time-custom`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        UNITS,
        changedUnit: ev => {
          let update = {unit: ev.detail.selected};
          let {unit, value} = this.app.activeStageClause || {};
          const unitPresets = TimeClause.UNIT_AND_VALUE_TO_RANGE[unit];
          const presetRange = unitPresets && unitPresets[value];

          if (presetRange) { // need to convert to absolute date values to allow new unit
            const from = formatDateISO(relativeToAbsoluteDate(value, unit));
            const to = formatDateISO(new Date());
            update = extend(update, {value: [from, to]});
          }

          this.updateStageClause(update, {shouldCommit: true});
        },
        getDates: () => this.app.getTimeClauseValue(this.app.activeStageClause),
        changedDates: ev => {
          if (ev.detail.selected) {
            // TODO remove once mp-toggle no longer fires change events
            return;
          }
          const {from, to} = ev.detail;
          const unit = unitForDateRange(from, to);
          const old = this.app.getTimeClauseValue(this.app.activeStageClause);
          if (from !== old.from || to !== old.to || unit !== old.unit) {
            this.setDates(from, to, unit);
          }
        },
        resizedCalendar: () => this.updateRenderedSize({
          cancelDuringTransition: true,
        }),
        getMaxDataHistoryDays: () => this.app.maxDataHistoryDays(),
        getMaxDataHistoryString: () => {
          const days = this.app.maxDataHistoryDays();
          if (days < 365) {
            return days.toString() + ` days`;
          }
          else {
            const years = Math.floor(days/365);
            return years.toString() + ` years`;
          }
        },
        dateLimited: () => {
          return this.app.maxDataHistoryDays() !== this.app.getFeatureGateValue(`unlimited`);
        },
      }),
    };
  }

  setDates(from, to, unit) {
    const params = {value: [from, to]};
    if (unit) {
      params.unit = unit;
    }
    this.updateStageClause(params, {shouldCommit: true});
  }
});

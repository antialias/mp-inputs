import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import {
  extend,
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
        changedUnit: ev => this.updateStageClause({unit: ev.detail.selected}, {shouldCommit: true}),
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

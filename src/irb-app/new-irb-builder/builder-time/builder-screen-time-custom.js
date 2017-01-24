import moment from 'moment';

import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import { extend, formatDateISO, relativeToAbsoluteDate } from '../../../util';

import template from './builder-screen-time-custom.jade';
import './builder-screen-time-custom.styl';

import '../../widgets/datepicker';

const UNITS = TimeClause.UNIT_LIST.filter(
  choice => choice !== TimeClause.UNITS.YEAR
);

document.registerElement(`builder-screen-time-custom`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        UNITS,
        changedUnit: ev => this.updateStageClause({unit: ev.detail.selected}, {shouldCommit: true}),
        getDates: () => this.getDates(),
        changedDates: ev => {
          const {from, to} = ev.detail;
          const oldRange = this.getDates();
          const daysApart = moment(to).diff(moment(from), `days`) + 1;

          // auto-adjust unit when changing date value
          let unit = null;
          if (daysApart <= 4) {
            unit = `hour`;
          } else if (daysApart <= 31) {
            unit = `day`;
          } else if (daysApart <= 183) {
            unit = `week`;
          } else {
            unit = `month`;
          }

          if (from !== oldRange.from || to !== oldRange.to || unit !== oldRange.unit) {
            this.setDates(ev.detail.from, ev.detail.to, unit);
          }
        },
      }),
    };
  }

  getDates() {
    const value = this.helpers.getStageClauseAttr(`value`);
    const unit = this.helpers.getStageClauseAttr(`unit`);
    let from = null;
    let to = null;

    if (Number.isInteger(value)) {
      from = formatDateISO(this.relativeToAbsoluteDate(value));
      to = formatDateISO(this.relativeToAbsoluteDate(0));
    } else if (Array.isArray(value)) {
      [from, to] = value;
      if (Number.isInteger(from)) {
        from = formatDateISO(this.relativeToAbsoluteDate(from));
      }
      if (Number.isInteger(to)) {
        to = formatDateISO(this.relativeToAbsoluteDate(to));
      }
    }

    return {from, to, unit};
  }

  setDates(from, to, unit) {
    const params = {value: [from, to]};
    if (unit) {
      params.unit = unit;
    }
    this.updateStageClause(params, {shouldCommit: true});
  }

  relativeToAbsoluteDate(relativeDateInt) {
    return relativeToAbsoluteDate(relativeDateInt, this.helpers.getStageClauseAttr(`unit`));
  }
});

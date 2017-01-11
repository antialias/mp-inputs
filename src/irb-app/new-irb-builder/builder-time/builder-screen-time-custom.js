import moment from 'moment';

import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import { extend, formatDateISO } from '../../../util';

import template from './builder-screen-time-custom.jade';
import './builder-screen-time-custom.styl';

import '../../widgets/date-input';
import '../../widgets/calendar';

const UNITS = TimeClause.UNIT_LIST.filter(
  choice => choice !== TimeClause.UNITS.YEAR
);

document.registerElement(`builder-screen-time-custom`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        UNITS,
        clickedUnit: unit => this.updateStageClause({unit}, {shouldCommit: true}),
        getDates: () => this.getDates(),
        changedDates: ev => {
          let {from, to} = ev.detail;
          if (from && to) {
            const oldRange  = this.getDates();

            if (from > to) {
              [from, to] = [to, from];
            }

            if (from !== oldRange.from || to !== oldRange.to) {
              // auto-adjust unit when changing date value
              let unit = null;
              const days = moment.utc(to).diff(moment.utc(from), `days`) + 1;
              if (days <= 4) {
                unit = `hour`;
              } else if (days <= 31) {
                unit = `day`;
              } else if (days <= 183) {
                unit = `week`;
              } else {
                unit = `month`;
              }

              this.setDates(from, to, unit);
            }
          }
        },
        changedFrom: ev => this.helpers.changedDates({detail: {
          from: ev.detail,
          to: this.getDates().to,
        }}),
        changedTo: ev => this.helpers.changedDates({detail: {
          from: this.getDates().from,
          to: ev.detail,
        }}),
        resizedCalendar: () => this.updateScreensRenderedSize(),
      }),
    };
  }

  getDates() {
    const value = this.helpers.getStageClauseAttr(`value`);
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

    return {from, to};
  }

  setDates(from, to, unit) {
    const params = {value: [from, to]};
    if (unit) {
      params.unit = unit;
    }
    this.updateStageClause(params, {shouldCommit: true});
  }

  relativeToAbsoluteDate(relativeDateInt) {
    const unit = this.helpers.getStageClauseAttr(`unit`);
    return new Date(moment().subtract(relativeDateInt, `${unit}s`));
  }
});

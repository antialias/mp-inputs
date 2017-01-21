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
          const now = moment();
          const oldRange = this.getDates();
          let unit = null;
          let {from, to} = ev.detail;

          if (from && moment(from) > now) {
            from = formatDateISO(now);
          }

          if (to && moment(to) > now) {
            to = formatDateISO(now);
          }

          if (from && to) {
            if (moment(from) > moment(to)) {
              [from, to] = [to, from];
            }

            const daysApart = moment(to).diff(moment(from), `days`) + 1;

            // auto-adjust unit when changing date value
            if (daysApart <= 4) {
              unit = `hour`;
            } else if (daysApart <= 31) {
              unit = `day`;
            } else if (daysApart <= 183) {
              unit = `week`;
            } else {
              unit = `month`;
            }
          }

          if (from !== oldRange.from || to !== oldRange.to || unit !== oldRange.unit) {
            this.setDates(from, to, unit);
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
        focusedFrom: () => this.app.updateBuilderCurrentScreen({fromFocused: true}),
        blurredFrom: () => this.app.updateBuilderCurrentScreen({fromFocused: false}),
        fromFocused: () => {
          const screen = this.app.getBuilderCurrentScreen();
          return !!(screen && screen.fromFocused);
        },
        focusedTo: () => this.app.updateBuilderCurrentScreen({toFocused: true}),
        blurredTo: () => this.app.updateBuilderCurrentScreen({toFocused: false}),
        toFocused: () => {
          const screen = this.app.getBuilderCurrentScreen();
          return !!(screen && screen.toFocused);
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
    const unit = this.helpers.getStageClauseAttr(`unit`);
    return new Date(moment().subtract(relativeDateInt, `${unit}s`));
  }
});

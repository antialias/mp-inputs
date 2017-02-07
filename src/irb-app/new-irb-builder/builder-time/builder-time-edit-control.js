import {
  extend,
  normalizeDates,
  unitForDateRange,
} from '../../../util';

import { EditControl } from '../edit-control';
import { TimeClause } from '../../../models/clause';

import template from './builder-time-edit-control.jade';

document.registerElement(`builder-time-edit-control`, class extends EditControl {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getDates: () => this.app.getTimeClauseValue(),
        isPresetRange: () => {
          const screen = this.app.getBuilderCurrentScreen();
          return this.getClause().range && (
            !screen || screen.componentName === `builder-screen-time`
          );
        },
        clickedFromLabel: () => {
          this.app.updateBuilder({focusInput: `from`});
          this.helpers.clickedLabel();
        },
        clickedToLabel: () => {
          this.app.updateBuilder({focusInput: `to`});
          this.helpers.clickedLabel();
        },
        focusFrom: () => this.state.builderPane.focusInput === `from`,
        focusTo: () => this.state.builderPane.focusInput === `to`,
        changedFrom: ev => this.setDates({from: ev.detail}),
        changedTo: ev => this.setDates({to: ev.detail}),
      }),
    };
  }

  setDates(dates) {
    const old = this.app.getTimeClauseValue();
    let {from=old.from, to=old.to} = dates;
    let update = {};

    if (from && to) {
      [from, to] = normalizeDates(from, to);
      update = {value: [from, to], unit: unitForDateRange(from, to)};
    } else if (from) {
      [from] = normalizeDates(from);
      update = {value: [from, to]};
    } else if (to) {
      [to] = normalizeDates(to);
      update = {value: [from, to]};
    }

    this.app.updateStageClause(update);
    this.app.commitStageClause();
  }

  get section() {
    return TimeClause.TYPE;
  }

  getLabel() {
    return this.getClause().range || TimeClause.RANGES.CUSTOM;
  }

  getSelectionAttrs() {
    return {
      source: `time`,
      selected: this.getLabel(),
    };
  }

  isRemovable() {
    return false;
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-time`);
  }
});

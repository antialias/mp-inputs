import {
  KEY_CODES,
  dateRangeToUnit,
  extend,
  normalizeDateStrings,
  parseDate,
  stringFilterMatches,
} from '../../../util';

import { EditControl } from '../edit-control';
import { TimeClause } from '../../../models/clause';

import '../../widgets/resize-date-input';

import template from './builder-time-edit-control.jade';

const SCREENS = {
  preset: `builder-screen-time`,
  custom: `builder-screen-time-custom`,
};

document.registerElement(`builder-time-edit-control`, class extends EditControl {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getDates: () => this.app.getTimeClauseValue(),
        isPresetRange: () =>
          this.getClause().range && !this.app.isShowingTimeClauseCustomControls(),
        updatedInput: ev => {
          this.helpers.changedSearch(ev);
          this.updateScreen(ev.target.value, {fromFocused: true});
        },
        updatedFrom: ev => this.updateScreen(ev.target.value, {fromFocused: true}),
        updatedTo: ev => this.updateScreen(ev.target.value, {toFocused: true}),
        clickedFromLabel: () => {
          this.helpers.focusFrom();
          this.helpers.clickedLabel();
        },
        clickedToLabel: () => {
          this.helpers.focusTo();
          this.helpers.clickedLabel();
        },
        focus: vnode => requestAnimationFrame(() => vnode.elm.focus()),
        focusFrom: () => this.app.updateBuilder({fromFocused: true, toFocused: false}),
        focusTo: () => this.app.updateBuilder({toFocused: true, fromFocused: false}),
        refocusFrom: () => requestAnimationFrame(() => {
          if (!this.state.builderPane.toFocused && this.helpers.isPaneOpen()) {
            this.helpers.focusFrom(); // re-focus if the input accidentally lost focus
          }
        }),
        refocusTo: () => requestAnimationFrame(() => {
          if (!this.state.builderPane.fromFocused && this.helpers.isPaneOpen()) {
            this.helpers.focusTo(); // re-focus if the input accidentally lost focus
          }
        }),
        changedFrom: ev => this.setDates({from: ev.detail}),
        changedTo: ev => this.setDates({to: ev.detail}),
        pressedKey: ev => {
          const value = ev.target.value;
          const enter = KEY_CODES.enter;
          const tab = KEY_CODES.tab;
          const key = ev.keyCode;

          if (key === tab || (key === enter && !value.length)) {
            if (this.state.builderPane.fromFocused) {
              this.helpers.focusTo();
            } else if (this.state.builderPane.toFocused) {
              this.helpers.focusFrom();
            }
          }

          if (key === enter && value.length) {
            if (this.state.builderPane.fromFocused) {
              this.helpers.focusTo();
            } else if (this.state.builderPane.toFocused) {
              // use RAF so we don't stop editing while a setDates call is happening
              requestAnimationFrame(() => this.app.stopEditingClause());
            }
          }
        },
      }),
    };
  }

  setDates(dates={}) {
    const old = this.app.getTimeClauseValue();
    let {from=old.from, to=old.to} = dates;
    [from, to] = normalizeDateStrings([from, to], {utcOffset: this.app.getUtcOffset()});

    this.app.updateStageClause({
      value: [from, to],
      unit: dateRangeToUnit(parseDate(from), parseDate(to)),
    }, {shouldCommit: true, shouldStopEditing: false});
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
    if (this.getClause().range) {
      this.app.startBuilderOnScreen(SCREENS.preset);
    } else {
      this.app.startBuilderOnScreen(SCREENS.custom, {previousScreens: [SCREENS.preset]});
    }
  }

  // based on the value of the input, decide whether to show the preset or custom range screen
  updateScreen(value, focused) {
    if (
      value.length >= 3 &&
      this.app.getBuilderCurrentScreenAttr(`componentName`) === SCREENS.preset &&
      TimeClause.RANGE_LIST.every(range => !stringFilterMatches(range, value))
    ) {
      this.showCustomScreen(focused);
    }
  }

  showCustomScreen(focused={}) {
    this.app.updateBuilder(extend(focused, {
      screens: this.state.builderPane.screens.concat({componentName: SCREENS.custom}),
      inTransition: true,
    }));
  }
});

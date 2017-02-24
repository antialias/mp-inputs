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
          switch (ev.keyCode) {
            case KEY_CODES.tab:
              if (this.state.builderPane.fromFocused) {
                this.helpers.focusTo();
              } else if (this.state.builderPane.toFocused) {
                this.helpers.focusFrom();
              }
              break;
            case KEY_CODES.enter:
              // use RAF so we don't stop editing while a setDates call is happening
              requestAnimationFrame(() => this.app.stopEditingClause());
              break;
          }
        },
      }),
    };
  }

  setDates(dates={}) {
    const old = this.app.getTimeClauseValue();
    const unit = old.unit;
    let {from=old.from, to=old.to} = dates;

    if (from && to) {
      [from, to] = normalizeDateStrings(from, to);
    } else if (from) {
      [from] = normalizeDateStrings(from);
    } else if (to) {
      [to] = normalizeDateStrings(to);
    }

    this.app.updateStageClause({
      value: [from, to],
      unit: dateRangeToUnit(parseDate(from), parseDate(to)),
    }, {shouldCommit: true});
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

  // based on the value of the input, decide whether to show the preset or custom range screen
  updateScreen(value, focused) {
    const presetRangeScreen = `builder-screen-time`;
    const customRangeScreen = `builder-screen-time-custom`;
    const currentScreen = this.app.getBuilderCurrentScreenAttr(`componentName`);
    if (
      currentScreen === presetRangeScreen && value.length >= 3 &&
      TimeClause.RANGE_LIST.every(range => !stringFilterMatches(range, value))
    ) {
      this.app.updateBuilder(extend(focused, {
        screens: this.state.builderPane.screens.concat({componentName: customRangeScreen}),
        inTransition: true,
      }));
    }
  }
});

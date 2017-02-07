import { Component } from 'panel';

import { formatDateISO, normalizeDates } from '../../util';

import template from './datepicker.jade';
import './datepicker.styl';

import './date-input';
import './calendar';

class DatePicker extends Component {
  get config() {
    return {
      template,
      defaultState: {
        date: null,
        from: null,
        to: null,
        fromFocused: false,
        toFocused: false,
      },
      helpers: {
        isRange: () => this.isRange,
        isDoubleCalendar: () => this.isDoubleCalendar,
        getPreposition: () => this.preposition,
        hideTextInputs: () => this.hideTextInputs,
        changedDates: ev => {
          if (this.isRange) {
            let {from=this.state.from, to=this.state.to} = ev.detail;
            [from, to] = normalizeDates(from, to);
            this.update({from, to, date: null});
          } else {
            let {date=this.state.date} = ev.detail;
            [date] = normalizeDates(date);
            this.update({date, from: null, to: null});
          }
          this.emitChange();
        },
        changedFrom: ev => this.helpers.changedDates({detail: {from: ev.detail}}),
        changedTo: ev => this.helpers.changedDates({detail: {to: ev.detail}}),
        focusedFrom: () => this.update({fromFocused: true}),
        blurredFrom: () => this.update({fromFocused: false}),
        focusedTo: () => this.update({toFocused: true}),
        blurredTo: () => this.update({toFocused: false}),
      },
    };
  }

  get value() {
    const from = this.state.from ? formatDateISO(this.state.from) : null;
    const to = this.state.to ? formatDateISO(this.state.to) : null;
    const date = this.state.date ? formatDateISO(this.state.date) : null;
    return this.isRange ? {from, to} : date;
  }

  set value(val) {
    this.update(this.isRange ? {from: val.from, to: val.to} : {date: val});
  }

  emitChange() {
    this.dispatchEvent(new CustomEvent(`change`, {detail: this.value}));
  }

  get isRange() {
    return this.isAttributeEnabled(`range`);
  }

  get isDoubleCalendar() {
    return this.isAttributeEnabled(`double-calendar`);
  }

  get hideTextInputs() {
    return this.getAttribute(`hide-text-inputs`);
  }

  get preposition() {
    return this.getAttribute(`preposition`);
  }
}

document.registerElement(`irb-datepicker`, DatePicker);

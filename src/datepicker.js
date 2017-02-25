import { Component } from 'panel';

import { normalizeDateStrings } from '../../util';

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
        maxDataHistory: () => this.maxDataHistory,
        changedDates: ev => {
          if (this.isRange) {
            let {from=this.state.from, to=this.state.to} = ev.detail;
            ;[from=null, to=null] = normalizeDateStrings(from, to);
            this.update({from, to, date: null});
          } else {
            let [date=null] = normalizeDateStrings(ev.detail || this.state.date);
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
        resizedCalendar: () => this.emitResize(),
      },
    };
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(...arguments);
    if (name === `from-focused`) {
      this.update({fromFocused: newValue});
    }
    if (name === `to-focused`) {
      this.update({toFocused: newValue});
    }
  }

  get value() {
    const from = this.state.from || null;
    const to = this.state.to || null;
    const date = this.state.date || null;
    return this.isRange ? {from, to} : date;
  }

  set value(val) {
    this.update(this.isRange ? {from: val.from, to: val.to} : {date: val});
  }

  emitChange() {
    this.dispatchEvent(new CustomEvent(`change`, {detail: this.value}));
  }

  emitResize() {
    this.dispatchEvent(new CustomEvent(`resize`));
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

  get maxDataHistory() {
    return this.getAttribute(`max-data-history`);
  }

  get preposition() {
    return this.getAttribute(`preposition`);
  }
}

document.registerElement(`insights-datepicker`, DatePicker);

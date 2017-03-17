import { Component } from 'panel';

import { formatDate, localizedDate, normalizeDateRange, normalizeDateStrings } from '../../util';

import template from './datepicker.jade';
import './datepicker.styl';

import './date-input';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
        utcOffset: 0,
      },
      helpers: {
        isRange: () => this.isRange,
        isDoubleCalendar: () => this.isDoubleCalendar,
        getPreposition: () => this.preposition,
        hideTextInputs: () => this.hideTextInputs,
        getMinDate: () => {
          // Use a reasonable threshold for maxDataHistory, beyond which we do not have a min-date
          if (this.maxDataHistory < 1000000) {
            const today = localizedDate({utcOffset: this.utcOffset}).setHours(0, 0, 0, 0);
            const date = new Date(today - (this.maxDataHistory * MS_PER_DAY));
            return formatDate(date, {iso: true});
          }
          return ``;
        },
        getMaxDate: () => {
          return formatDate(localizedDate({utcOffset: this.utcOffset}));
        },
        selectDate: detail => {
          if (this.isRange) {
            let {from=this.state.from, to=this.state.to} = detail;
            [from=null, to=null] = normalizeDateStrings([from, to], {utcOffset: this.utcOffset});
            this.update({from, to, date: null});
          } else {
            let [date=null] = normalizeDateStrings([detail.date || this.state.date], {utcOffset: this.utcOffset});
            this.update({date, from: null, to: null});
          }
          this.emitChange();
        },
        changedFrom: ev => {
          let from = ev.detail;
          let to = this.state.to;
          [from, to] = normalizeDateRange([from, to], `from`);
          this.helpers.selectDate({from, to});
        },
        changedTo: ev => {
          let from = this.state.from;
          let to = ev.detail;
          [from, to] = normalizeDateRange([from, to], `to`);
          this.helpers.selectDate({from, to});
        },
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
    const maxDataHistory = this.getAttribute(`max-data-history`);
    return maxDataHistory !== null ? Number(maxDataHistory) : null;
  }

  get preposition() {
    return this.getAttribute(`preposition`);
  }

  get utcOffset() {
    return this.state.utcOffset;
  }

  set utcOffset(utcOffset) {
    this.update({utcOffset});
  }
}

document.registerElement(`insights-datepicker`, DatePicker);

import Pikaday from 'pikaday';
import WebComponent from 'webcomponent';

import {
  extend,
  localizedDate,
  formatDate,
  parseDate,
} from '../../util';

import './calendar.styl';

const INCOMPLETE_RANGE_CLASS = `incomplete-range`;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

class Calendar extends WebComponent {
  createdCallback() {
    this.from = null;
    this.to = null;
    this.date = null;
  }

  attachedCallback() {
    this.init();
  }

  attributeChangedCallback(name) {
    if (!this._initialized || name === `double-calendar`) {
      this.init();
    }
  }

  set value(val) {
    this.from = parseDate(val && val.from);
    this.to = parseDate(val && val.to);
    this.date = parseDate(val);
    this.updatePicker();
  }

  init() {
    this._initialized = true;
    this.innerHTML = ``;
    this.picker = new Pikaday({
      bound: false,
      container: document.getElementsByClassName(`calendar-hook`)[0],
      events: this.getFutureDates(),
      mainCalendar: `right`,
      maxDate: localizedDate(this.utcOffset),
      minDate: this.getMinDate(),
      numberOfMonths: this.isDoubleCalendar ? 2 : 1,
      i18n: extend(Pikaday.prototype.config().i18n, {
        weekdaysShort: [`SU`, `MO`, `TU`, `WE`, `TH`, `FR`, `SA`],
      }),
      showDaysInNextAndPreviousMonths: false,
      theme: `pika-mixpanel`,
      yearRange: 10,
      onSelect: date => this.selectDate(date),
      onDraw: () => this.emitResize(),
    });

    // Pikaday registers a keydown event handler on the document (?#&!), get rid of it
    document.removeEventListener(`keydown`, this.picker._onKeyChange);

    this.appendChild(this.picker.el);
    this.updatePicker();
  }

  getMinDate() {
    const historyLength = this.historyLengthInDays;
    const today = localizedDate(this.utcOffset).setHours(0, 0, 0, 0);
    return new Date(today - (historyLength * MS_PER_DAY));
  }

  getFutureDates() {
    let futureDates = [];
    const today = localizedDate(this.utcOffset);
    let date = today.getDate();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    let newDate = new Date(thisYear, thisMonth, date);
    while (newDate.getMonth() === thisMonth) {
      futureDates.push(newDate.toDateString());
      date++;
      newDate = new Date(thisYear, thisMonth, date);
    }
    return futureDates;
  }

  updatePicker() {
    if (this.picker) {
      this.picker.setDate(this.date);
      this.picker.setStartRange(this.from);
      this.picker.setEndRange(this.to);

      if (this.from && !this.to) {
        this.picker.el.classList.add(INCOMPLETE_RANGE_CLASS);
      } else {
        this.picker.el.classList.remove(INCOMPLETE_RANGE_CLASS);
      }

      this.picker.draw();
      this.addPickerRowClasses();
    }
  }

  selectDate(date, emit=true) {
    const oldDate = this.date;
    const oldFrom = this.from;
    const oldTo = this.to;
    if (!this.isRange) {
      this.date = date;
      this.from = null;
      this.to = null;
    } else {
      this.date = null;

      if (this.isAttributeEnabled(`from-focused`)) {
        this.from = date;
      } else if (this.isAttributeEnabled(`to-focused`)) {
        this.to = date;
      } else if (!this.from) {
        this.from = date;
      } else if (!this.to) {
        this.to = date;
      } else {
        this.from = date;
        this.to = null;
      }
    }

    if (this.from && this.to && this.from > this.to) {
      [this.from, this.to] = [this.to, this.from];
    }

    if (
      formatDate(this.date, {iso: true}) !== formatDate(oldDate, {iso: true}) ||
      formatDate(this.from, {iso: true}) !== formatDate(oldFrom, {iso: true}) ||
      formatDate(this.to, {iso: true}) !== formatDate(oldTo, {iso: true})
    ) {
      this.updatePicker();
    }

    if (emit) {
      this.emitChange();
    }
  }

  emitChange() {
    const from = formatDate(this.from, {iso: true});
    const to = formatDate(this.to, {iso: true});
    const date = formatDate(this.date, {iso: true});
    const detail = this.isRange ? {from, to} : date;

    if (detail) {
      this.dispatchEvent(new CustomEvent(`change`, {detail}));
    }
  }

  emitResize() {
    this.dispatchEvent(new CustomEvent(`resize`));
  }

  get historyLengthInDays() {
    return this.getAttribute(`max-days`);
  }

  get isRange() {
    return this.isAttributeEnabled(`range`);
  }

  get isDoubleCalendar() {
    return this.isAttributeEnabled(`double-calendar`);
  }

  get utcOffset() {
    return this._utcOffset || 0;
  }

  set utcOffset(utcOffset) {
    this._utcOffset = utcOffset;
  }

  // For each tr, if it has a child td.is-(start|end|in)range give it the class .has-(start|end|in)range
  // Used to handle edge cases around highlighting cells in the month grid where days are not shown
  // because they are from previous or following months. We still want to highlight these cells
  // according to the date range that is selected.
  addPickerRowClasses() {
    for (const row of Array.from(this.picker.el.getElementsByTagName(`tr`))) {
      for (const type of [`start`, `end`, `in`]) {
        if (Array.from(row.childNodes).some(node => node.classList.contains(`is-${type}range`))) {
          row.classList.add(`has-${type}range`);
        }
      }
    }
  }
}

document.registerElement(`insights-calendar`, Calendar);

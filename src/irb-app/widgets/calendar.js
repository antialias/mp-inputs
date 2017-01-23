import Pikaday from 'pikaday';
import WebComponent from 'webcomponent';

import {
  extend,
  formatDateISO,
  parseDate,
} from '../../util';

import './calendar.styl';

const INCOMPLETE_RANGE_CLASS = `incomplete-range`;

class Calendar extends WebComponent {
  createdCallback() {
    this.from = null;
    this.to = null;
    this.date = null;
  }

  attachedCallback() {
    this.init();
  }

  attributeChangedCallback() {
    if (this._initialized) {
      this.init();
    }
  }

  set value(val) {
    try {
      val = JSON.parse(val);
    } catch(e) {
      // pass
    }

    this.from = val && val.from ? parseDate(val.from) : null;
    this.to = val && val.to ? parseDate(val.to) : null;
    this.date = val && !val.from && !val.to ? parseDate(val) : null;

    this.updatePicker();
  }

  init() {
    this._initialized = true;
    this.innerHTML = ``;
    this.picker = new Pikaday({
      bound: false,
      container: document.getElementsByClassName(`calendar-hook`)[0],
      mainCalendar: `right`,
      maxDate: new Date(),
      numberOfMonths: this.isRange ? 2 : 1,
      i18n: extend(Pikaday.prototype.config().i18n, {
        weekdaysShort: [`SU`, `MO`, `TU`, `WE`, `TH`, `FR`, `SA`],
      }),
      showDaysInNextAndPreviousMonths: true,
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

  updatePicker() {
    if (this.picker) {
      if (!this.isRange) {
        this.picker.setDate(this.date);
      } else {
        this.picker.setStartRange(this.from);
        this.picker.setEndRange(this.to);

        if (this.from && !this.to) {
          this.picker.el.className += ` ${INCOMPLETE_RANGE_CLASS}`;
        } else {
          this.picker.el.className = this.picker.el.className.replace(` ${INCOMPLETE_RANGE_CLASS}`, ``);
        }
      }
      this.picker.draw();
    }
  }

  selectDate(date, emit=true) {
    const oldDate = this.date;
    const oldFrom = this.from;
    const oldTo = this.to;

    if (!this.isRange) {
      this.date = date;
    } else if (this.isAttributeEnabled(`fromFocused`)) {
      this.from = date;
    } else if (this.isAttributeEnabled(`toFocused`)) {
      this.to = date;
    } else if (!this.from) {
      this.from = date;
    } else if (!this.to) {
      this.to = date;
    } else {
      this.from = date;
      this.to = null;
    }

    if (this.from && this.to && this.from > this.to) {
      [this.from, this.to] = [this.to, this.from];
    }

    if (
      formatDateISO(this.date) !== formatDateISO(oldDate) ||
      formatDateISO(this.from) !== formatDateISO(oldFrom) ||
      formatDateISO(this.to) !== formatDateISO(oldTo)
    ) {
      this.updatePicker();
    }

    if (emit) {
      this.emitChange();
    }
  }

  emitChange() {
    const from = this.from ? formatDateISO(this.from) : null;
    const to = this.to ? formatDateISO(this.to) : null;
    const date = this.date ? formatDateISO(this.date) : null;
    const detail = this.isRange ? {from, to} : date;

    if (detail) {
      this.dispatchEvent(new CustomEvent(`change`, {detail}));
    }
  }

  emitResize() {
    this.dispatchEvent(new CustomEvent(`resize`));
  }

  get isRange() {
    return this.isAttributeEnabled(`range`);
  }
}

document.registerElement(`irb-calendar`, Calendar);

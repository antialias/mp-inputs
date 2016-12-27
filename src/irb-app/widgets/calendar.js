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

    this.from = val.from ? parseDate(val.from) : null;
    this.to = val.to ? parseDate(val.to) : null;
    this.date = val && !val.from && !val.to ? parseDate(val) : null;

    this.updatePicker();
  }

  init() {
    this._initialized = true;
    this.innerHTML = ``;
    this.isRangeInput = this.isAttributeEnabled(`range`);
    this.picker = new Pikaday({
      bound: false,
      container: document.getElementsByClassName(`calendar-hook`)[0],
      mainCalendar: `right`,
      maxDate: new Date(),
      numberOfMonths: this.isRangeInput ? 2 : 1,
      i18n: extend(Pikaday.prototype.config().i18n, {
        weekdaysShort: [`SU`, `MO`, `TU`, `WE`, `TH`, `FR`, `SA`],
      }),
      onSelect: date => this.selectDate(date),
      showDaysInNextAndPreviousMonths: true,
      theme: `pika-mixpanel`,
      yearRange: 10,
    });
    this.appendChild(this.picker.el);
    this.updatePicker();
  }

  emitChange() {
    let detail = null;

    if (!this.isRangeInput) {
      if (this.date) {
        detail = {
          date: formatDateISO(this.date),
        };
      }
    } else if (this.from && this.to) {
      detail = {
        from: formatDateISO(this.from),
        to: formatDateISO(this.to),
      };
    }

    if (detail) {
      this.dispatchEvent(new CustomEvent(`change`, {detail}));
    }
  }

  emitResize() {
    this.dispatchEvent(new CustomEvent(`resize`));
  }

  updatePicker() {
    if (this.picker) {
      if (!this.isRangeInput) {
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
    if (!this.isRangeInput) {
      this.date = date;
    } else if (!this.from) {
      this.from = date;
    } else if (!this.to) {
      if (date < this.from) {
        this.to = this.from;
        this.from = date;
      } else {
        this.to = date;
      }
    } else {
      this.from = date;
      this.to = null;
    }

    this.updatePicker();

    if (emit) {
      this.emitChange();
    }
  }
}

document.registerElement(`irb-calendar`, Calendar);

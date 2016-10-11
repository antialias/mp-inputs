import moment from 'moment';
import Pikaday from 'pikaday';
import WebComponent from 'webcomponent';

import './mp-calendar.styl';

document.registerElement(`mp-calendar`, class extends WebComponent {
  createdCallback() {
    this.selectedStr = [];
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
    let newVal;
    try {
      newVal = JSON.parse(val);
    } catch(e) {
      newVal = val;
    }
    if (newVal.from) {
      this.selectedStr[0] = newVal.from;
    }
    if (newVal.to) {
      this.selectedStr[1] = newVal.to;
    }
    if (!newVal.from && !newVal.to) {
      this.selectedStr[0] = newVal;
    }
  }

  init() {
    this._initialized = true;
    this.innerHTML = ``;
    this.startDate = this.endDate = null;

    this.rangeSelect = this.isAttributeEnabled(`range`);
    const numInputs = this.rangeSelect ? 2 : 1;
    this.inputs = Array(numInputs).fill().map((x, idx) => {
      const el = {};

      el.input = document.createElement(`input`);
      el.input.className = `mp-pikaday-input`;

      el.picker = new Pikaday({
        showDaysInNextAndPreviousMonths: true,
        bound: false,
        container: document.getElementsByClassName(`calendar-hook`)[0],
        field: el.input,
        numberOfMonths: 2,
        onSelect: date => this.selectDate(date, idx),
        theme: `pika-mixpanel`,
      });
      // TODO TMP FOR DEVELOPMENT, REVERT ME
      // el.picker.hide();

      el.input.addEventListener(`focus`, () => el.picker.show());
      // el.input.addEventListener(`blur`, () => el.picker.hide());

      this.appendChild(el.input);

      return el;
    });

    this.inputs.forEach((input, idx) => {
      if (this.selectedStr[idx]) {
        input.picker.setDate(new Date(Number(moment(this.selectedStr[idx]))));
      }
    });
  }

  emitChange() {
    if (this.rangeSelect) {
      if (this.startDate && this.endDate) {
        this.dispatchEvent(new CustomEvent(`change`, {
          detail: [
            this.formatDate(this.startDate),
            this.formatDate(this.endDate),
          ],
        }));
      }
    } else {
      this.dispatchEvent(new CustomEvent(`change`, {
        detail: this.formatDate(this.startDate),
      }));
    }
  }

  formatDate(date) {
    return date.toISOString().slice(0, 10);
  }

  selectDate(date, idx, emit=true) {
    if (this.rangeSelect) {
      switch(idx) {
        case 0:
          this.startDate = date;
          this.inputs[0].picker.setStartRange(date);
          this.inputs[1].picker.setStartRange(date);
          this.inputs[1].picker.setMinDate(date);
          break;
        case 1:
          this.endDate = date;
          this.inputs[1].picker.setEndRange(date);
          this.inputs[0].picker.setEndRange(date);
          this.inputs[0].picker.setMaxDate(date);
          break;
      }
    } else {
      this.startDate = date;
    }
    if (emit) {
      this.emitChange();
    }
    this.inputs[idx].picker.hide();
    this.inputs[idx].input.blur();
  }
});

import Pikaday from 'pikaday';
import WebComponent from 'webcomponent';

import './mp-calendar.styl';

document.registerElement('mp-calendar', class extends WebComponent {
  attachedCallback() {
    this.init();
  }

  attributeChangedCallback() {
    if (this._initialized) {
      this.init();
    }
  }

  init() {
    this._initialized = true;
    this.innerHTML = '';
    this.startDate = this.endDate = null;

    this.rangeSelect = this.isAttributeEnabled('range');
    const numInputs = this.rangeSelect ? 2 : 1;
    this.inputs = Array(numInputs).fill().map((x, idx) => {
      const el = {};

      el.input = document.createElement('input');
      el.input.className = 'mp-pikaday-input';

      el.picker = new Pikaday({
        bound: false,
        container: document.getElementsByClassName('calendar-hook')[0],
        field: el.input,
        numberOfMonths: 2,
        onSelect: date => this.selectDate(date, idx),
      });
      el.picker.hide();

      el.input.addEventListener('focus', () => el.picker.show());
      el.input.addEventListener('blur', () => el.picker.hide());

      this.appendChild(el.input);

      return el;
    });
  }

  emitChange() {
    if (this.rangeSelect) {
      if (this.startDate && this.endDate) {
        this.dispatchEvent(new CustomEvent('change', {
          detail: [
            this.formatDate(this.startDate),
            this.formatDate(this.endDate),
          ],
        }));
      }
    } else {
      this.dispatchEvent(new CustomEvent('change', {
        detail: this.formatDate(this.startDate),
      }));
    }
  }

  formatDate(date) {
    return date.toISOString().slice(0, 10);
  }

  selectDate(date, idx) {
    if (this.rangeSelect) {
      switch(idx) {
        case 0:
          this.startDate = date;
          this.inputs[0].picker.setStartRange(date);
          this.inputs[1].picker.setStartRange(date);
          this.inputs[1].picker.setMinDate(date);
          this.emitChange();
          break;
        case 1:
          this.endDate = date;
          this.inputs[1].picker.setEndRange(date);
          this.inputs[0].picker.setEndRange(date);
          this.inputs[0].picker.setMaxDate(date);
          this.emitChange();
          break;
      }
    } else {
      this.startDate = date;
      this.emitChange();
    }
    this.inputs[idx].picker.hide();
    this.inputs[idx].input.blur();
  }
});

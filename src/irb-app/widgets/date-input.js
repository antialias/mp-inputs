import { Component } from 'panel';

import {
  formatDateDisplay,
  formatDateISO,
  parseDate,
} from '../../util';

import template from './date-input.jade';

class DateInput extends Component {
  get config() {
    return {
      template,
      defaultState: {
        dateValue: null,
        textValue: null,
      },
      helpers: {
        formatDateDisplay,
        focusedInput: () => {
          this.inputEl.value = this.state.textValue;
        },
        blurredInput: () => {
          this.inputEl.value = formatDateDisplay(this.value);
        },
        changedInput: ev => {
          ev.stopPropagation();
          this.update({dateValue: parseDate(this.inputEl.value), textValue: this.inputEl.value});
          this.emitChange();
        },
      },
    };
  }

  emitChange() {
    const detail = formatDateISO(this.value);
    this.dispatchEvent(new CustomEvent(`change`, {detail}));
  }

  get inputEl() {
    return this.querySelector(`input`);
  }

  get value() {
    return this.state.dateValue;
  }

  set value(dateValue) {
    const textValue = this.state.textValue || formatDateDisplay(dateValue);
    this.update({dateValue, textValue});
  }
}

document.registerElement(`date-input`, DateInput);

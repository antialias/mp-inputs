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
        value: null,
      },
      helpers: {
        formatDateDisplay,
        focusedInput: () => this.emitFocus(),
        blurredInput: () => {
          this.inputEl.value = ``;
          this.emitBlur();
        },
        changedInput: ev => {
          ev.stopPropagation();
          const value = this.inputEl.value.length ? parseDate(this.inputEl.value) : null;
          this.update({value});
          this.emitChange();
        },
      },
    };
  }

  emitFocus() {
    this.dispatchEvent(new CustomEvent(`focus`));
  }

  emitBlur() {
    this.dispatchEvent(new CustomEvent(`blur`));
  }

  emitChange() {
    const detail = formatDateISO(this.value);
    this.dispatchEvent(new CustomEvent(`change`, {detail}));
  }

  get inputEl() {
    return this.querySelector(`input`);
  }

  get value() {
    return this.state.value;
  }

  set value(value) {
    this.update({value});
  }
}

document.registerElement(`date-input`, DateInput);

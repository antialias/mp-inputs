import { Component } from 'panel';

import {
  formatDateDisplay,
  formatDateISO,
  parseDate,
} from '../../util';

import template from './date-input.jade';

export default class DateInput extends Component {
  get config() {
    return {
      template,
      defaultState: {
        inputValue: null,
      },
      helpers: {
        formatDateDisplay,
        focus: vnode => requestAnimationFrame(() => vnode.elm.focus()),
        focusedInput: () => this.emitFocus(),
        blurredInput: () => {
          this.inputEl.value = ``;
          this.emitBlur();
        },
        changedInput: ev => {
          ev.stopPropagation();
          const inputValue = this.inputEl.value.length ? parseDate(this.inputEl.value) : null;
          this.update({inputValue});
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
    return this.state.inputValue;
  }

  set value(inputValue) {
    this.update({inputValue});
  }
}

document.registerElement(`date-input`, DateInput);

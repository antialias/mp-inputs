import {
  extend,
  formatDate,
  parseDate,
} from '../../util';

import ResizeInput from './resize-input';

import template from './resize-date-input.jade';

export default class ResizeDateInput extends ResizeInput {
  get config() {
    const config = super.config;
    return extend(config, {
      template,
      helpers: extend(config.helpers, {
        // TODO: remove duplication of helpers between this and DateInput
        formatDate: dateString => formatDate(parseDate(dateString)),
        focusedInput: () => {
          this.resize();
          this.emitFocus();
        },
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
      }),
    });
  }

  attachedCallback() {
    super.attachedCallback(...arguments);
    this.inputEl.value = this.getAttribute(`initial-input-value`) || ``;
  }

  emitFocus() {
    this.dispatchEvent(new CustomEvent(`focus`));
  }

  emitBlur() {
    this.dispatchEvent(new CustomEvent(`blur`));
  }

  emitChange() {
    const detail = formatDate(this.value, {iso: true});
    this.dispatchEvent(new CustomEvent(`change`, {detail}));
  }

  get inputEl() {
    return this.querySelector(`input`);
  }

  get placeholder() {
    return this.inputEl.getAttribute(`placeholder`);
  }
}

document.registerElement(`resize-date-input`, ResizeDateInput);

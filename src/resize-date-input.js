import {registerElement} from 'register-unique-tagname';
import extend from 'lodash/fp/extend';
import {
  formatDate,
  parseDate,
} from 'mixpanel-common/util/date';

import ResizeInput from './resize-input';

import template from './resize-date-input.jade';

export default class ResizeDateInput extends ResizeInput {
  get config() {
    const config = super.config;
    return extend(config, {
      template,
      helpers: extend(config.helpers, {
        // TODO: remove duplication of helpers between this and DateInput
        formatDate,
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
          const inputValue = this.inputEl.value.length ? formatDate(parseDate(this.inputEl.value)) : null;
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
    const detail = formatDate(parseDate(this.value), {iso: true});
    this.dispatchEvent(new CustomEvent(`change`, {detail}));
  }

  get inputEl() {
    return this.querySelector(`input`);
  }

  get placeholder() {
    return this.inputEl.getAttribute(`placeholder`);
  }
}

registerElement(`resize-date-input`, ResizeDateInput, __filename);

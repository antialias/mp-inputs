import { Component } from 'panel';

import template from './mp-button-input.jade';
import './mp-button-input.styl';

document.registerElement('mp-button-input', class extends Component {
  get config() {
    return {
      defaultState: {
        active: false,
        inputValue: '',
      },
      helpers: {
        blur: () => this.update({active: false}),
        focus: () => this.update({active: true}),
        inputChange: ev => {
          ev.stopPropagation();
          this.update({inputValue: this.value});
          this.dispatchChange();
        },

        click: ev => {
          ev.stopPropagation();
          if (this.state.active) {
            this.dispatchChange({save: true});
          } else {
            this.inputEl.focus();
          }
        },
      },
      template,
    };
  }

  dispatchChange(options={}) {
    this.dispatchEvent(new CustomEvent('change', {
      detail: Object.assign({value: this.value}, options),
    }));
  }

  get inputEl() {
    return this.querySelector('input');
  }

  get value() {
    const inputEl = this.inputEl;
    return inputEl ? inputEl.value : '';
  }

  set value(val) {
    this.update({inputValue: val});
  }
});

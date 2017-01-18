import { Component } from 'panel';

import template from './mp-button-input.jade';
import './mp-button-input.styl';

document.registerElement(`mp-button-input`, class extends Component {
  get config() {
    return {
      defaultState: {
        enabled: true,
        active: false,
        inputValue: ``,
      },
      helpers: {
        blur: () => this.update({active: false}),
        focus: () => this.update({active: true}),
        inputChange: ev => {
          ev.stopPropagation();
          this.update({inputValue: this.value});
          this.dispatchChange();
        },

        buttonMousedown: ev => {
          if (this.state.active) {
            // don't let input blur until we save!
            ev.preventDefault();
          }
        },

        clickSave: ev => {
          ev.stopPropagation();
          if (this.state.active) {
            this.dispatchChange({save: true});
            this.inputEl.blur();
          } else {
            this.inputEl.focus();
          }
        },
      },
      template,
    };
  }

  attachedCallback() {
    super.attachedCallback(...arguments);
    this.closeOnEscape = e => e.keyCode === 27 && this.inputEl.blur();
    document.body.addEventListener(`keydown`, this.closeOnEscape);
  }

  detachedCallback() {
    document.body.removeEventListener(`keydown`, this.closeOnEscape);
  }

  attributeChangedCallback() {
    this.update({enabled: !this.isAttributeEnabled(`disabled`)});
  }

  dispatchChange(options={}) {
    this.dispatchEvent(new CustomEvent(`change`, {
      detail: Object.assign({value: this.value}, options),
    }));
  }

  get inputEl() {
    return this.querySelector(`input`);
  }

  get value() {
    const inputEl = this.inputEl;
    return inputEl ? inputEl.value : ``;
  }

  set value(val) {
    this.update({inputValue: val});
  }
});

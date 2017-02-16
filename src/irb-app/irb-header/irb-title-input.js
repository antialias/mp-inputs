import { Component } from 'panel';

import template from './irb-title-input.jade';
import './irb-title-input.styl';

const MIN_INPUT_WIDTH = `170`;

document.registerElement(`irb-title-input`, class extends Component {
  get config() {
    return {
      defaultState: {
        enabled: true,
        active: false,
        inputValue: ``,
        inputWidth: MIN_INPUT_WIDTH,
      },
      helpers: {
        blur: () => {
          this.update({active: false});
          this.dispatchChange();
        },
        focus: () => this.update({active: true}),
        inputChange: () => {
          this.update({inputValue: this.value});
          this._resizeInput();
        },

        buttonMousedown: ev => {
          if (this.state.active) {
            // don't let input blur until we save!
            ev.preventDefault();
          }
        },

        clickSave: (ev, saveAsNew=false) => {
          ev.stopPropagation();
          if (this.state.active) {
            this.dispatchChange({save: true, saveAsNew});
            this.inputEl.blur();
          } else {
            this.inputEl.focus();
          }
        },

        clickSaveNew: ev => this.helpers.clickSave(ev, true),
      },
      template,
    };
  }

  attachedCallback() {
    super.attachedCallback(...arguments);
    this.closeOnEscape = e => e.keyCode === 27 && this.inputEl.blur();
    document.body.addEventListener(`keydown`, this.closeOnEscape);
    this._resizeInput();
  }

  detachedCallback() {
    document.body.removeEventListener(`keydown`, this.closeOnEscape);
  }

  _resizeInput() {
    // make the search input width dynamic
    const span = document.createElement(`span`);
    span.className = `mp-name-input-dummy`;
    span.innerText = this.state.inputValue;
    this.el.appendChild(span);
    const buffer = 12;
    this.update({inputWidth: Math.max(span.offsetWidth + buffer, MIN_INPUT_WIDTH)});
    this.el.removeChild(span);
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

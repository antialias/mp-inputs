import { Component } from 'panel';

import template from './irb-title-input.jade';
import './irb-title-input.styl';

document.registerElement(`irb-title-input`, class extends Component {
  get config() {
    return {
      defaultState: {
        enabled: true,
        active: false,
        inputValue: ``,
        isDirty: false,
      },
      helpers: {
        blur: () => {
          this.update({active: false});
          this.dispatchChange();
        },
        focus: () => this.update({active: true, isDirty: false}),
        inputChange: () => {
          this.update({inputValue: this.value, isDirty: true});
        },

        buttonMousedown: ev => {
          if (this.state.active) {
            // don't let input blur until we save!
            ev.preventDefault();
          }
        },

        clickSave: (ev, saveAsNew=false) => {
          ev.stopPropagation();
          if (this.helpers.isSaveDisabled()) {
            return;
          }
          if (this.state.active) {
            this.dispatchChange({save: true, saveAsNew});
            this.inputEl.blur();
          } else {
            this.inputEl.focus();
          }
        },

        clickSaveNew: ev => this.helpers.clickSave(ev, true),

        isSaveDisabled: () => !this.state.isDirty || !this.state.inputValue,
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

import { Component } from 'panel';

import template from './insights-title-input.jade';
import './insights-title-input.styl';

document.registerElement(`insights-title-input`, class extends Component {
  get config() {
    return {
      defaultState: {
        enabled: true,
        active: false,
        inputValue: ``,
        isDirty: false,
        saveFocused: false,
        saveNewFocused: false,
      },
      helpers: {
        blur: () => {
          if (this.state.active) {
            this.update({active: true, saveFocused: false, saveNewFocused: false});
            this.dispatchChange();
          }
        },
        focus: () => this.update({active: true, isDirty: false}),
        inputChange: () => {
          this.update({inputValue: this.value, isDirty: true, saveFocused: false, saveNewFocused: false});
        },
        keydownHandler: ev => {
          const saveFocused = this.state.saveFocused;
          switch(ev.keyCode) {
            case 9: {
              ev.preventDefault();
              this.update({saveFocused: !saveFocused, saveNewFocused: saveFocused});
              break;
            }
            case 13: {
                this.saveReport(ev, {saveAsNew: this.state.saveNewFocused});
            }
          }
        },
        buttonMousedown: ev => {
          if (this.state.active) {
            // don't let input blur until we save!
            ev.preventDefault();
          }
        },
        clickSave: ev => !this.helpers.isSaveDisabled() && this.saveReport(ev),
        clickSaveNew: ev => !this.helpers.isSaveNewDisabled() && this.saveReport(ev, {saveAsNew: true}),
        isSaveDisabled: () => !this.state.inputValue,
        isSaveNewDisabled: () => !this.state.isDirty || !this.state.inputValue,
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

  saveReport(ev, {saveAsNew=false}={}) {
    ev.stopPropagation();
    if (this.state.active) {
      this.dispatchChange({save: true, saveAsNew});
      this.update({active: true, saveFocused: false, saveNewFocused: false});
      this.inputEl.blur();
    } else {
      this.inputEl.focus();
    }
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

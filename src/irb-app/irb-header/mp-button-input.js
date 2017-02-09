import { Component } from 'panel';

import template from './mp-button-input.jade';
import './mp-button-input.styl';

const MIN_INPUT_WIDTH = `170`;

document.registerElement(`mp-button-input`, class extends Component {
  get config() {
    return {
      defaultState: {
        active: false,
        enabled: true,
        inputValue: ``,
        inputWidth: MIN_INPUT_WIDTH,
        saveReportUpsell: false,
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

        clickSave: ev => {
          let that = this;
          fetch(this.bookmarkUrl, {
            credentials: `same-origin`,
            method: `GET`,
          })
          .then(res => res.json())
          .then(res => {
            if (res.error) {
              throw new Error(res.error);
            }
            if (res.bookmark_count < this.bookmarkLimit) {
              ev.stopPropagation();
              if (that.state.active) {
                that.dispatchChange({save: true});
                that.inputEl.blur();
              } else {
                that.inputEl.focus();
              }
            } else {
              that.update({saveReportUpsell: true});
            }
          });
        },
        closeUpsell: e => {
          if (e.detail.state === `closed`) {
            this.update({saveReportUpsell: false, enabled: true});
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

  get bookmarkUrl() {
    return this.getAttribute(`bookmark-url`);
  }

  get bookmarkLimit() {
    return this.getAttribute(`bookmark-limit`);
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

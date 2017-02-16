import { Component } from 'panel';

import template from './resize-input.jade';

const GLOBAL_MIN_WIDTH = 90;
const SIZER_PROPS = [
  `border`,
  `fontFamily`,
  `fontSize`,
  `fontWeight`,
  `height`,
  `letterSpacing`,
  `padding`,
  `whiteSpace`,
];

export default class ResizeInput extends Component {
  get config() {
    return {
      template,
      updateSync: true,
      defaultState: {
        autofocus: true,
        inputValue: ``,
        inputWidth: this.defaulMinWidth,
      },
      helpers: {
        inserted: vnode => requestAnimationFrame(() => vnode.elm.focus()),
        updatedInput: ev => this.value = ev.target.value,
      },
    };
  }

  createdCallback() {
    super.createdCallback(...arguments);
    this.minimumWidth = this.defaultMinWidth;
  }

  attachedCallback() {
    super.attachedCallback(...arguments);
    this.removeSizer();
    this.setMinimumWidth(this.getTextWidth(this.placeholder));
    this.resize();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(...arguments);
    if (name === `placeholder`) {
      this.setMinimumWidth(this.getTextWidth(newValue));
    }
  }

  detachedCallback() {
    this.removeSizer();
  }

  removeSizer() {
    if (this.sizer) {
      this.sizer.remove();
      this.sizer = null;
    }
  }

  focus() {
    const input = this.querySelector(`input`);
    if (input) {
      input.focus();
    }
  }

  getTextWidth(text) {
    if (!this.sizer) {
      this.sizer = document.createElement(`div`);

      const tmpInput = document.createElement(`input`);
      tmpInput.type = `text`;
      this.appendChild(tmpInput);
      const inputStyle = getComputedStyle(tmpInput);
      for (let prop of SIZER_PROPS) {
        this.sizer.style[prop] = inputStyle[prop];
      }
      tmpInput.remove();

      this.sizer.style.display = `inline-block`;
      this.sizer.style.position = `absolute`;
      this.sizer.style.top = `-1000px`;
      this.sizer.style.visibility = `hidden`;

      document.body.appendChild(this.sizer);
    }
    text = text || ``;
    while (text.endsWith(` `)) {
      text = `&nbsp;${text.slice(0, text.length - 1)}`;
    }
    this.sizer.innerHTML = text.replace(` `, `&nbsp;`);
    return Math.round(this.sizer.getBoundingClientRect().width);
  }

  resize() {
    const newWidth = Math.ceil(Math.max(this.minimumWidth, this.getTextWidth(this.state.inputValue)));
    this.update({inputWidth: newWidth});
  }

  setMinimumWidth(newMin) {
    if (newMin !== this.minimumWidth) {
      this.minimumWidth = Math.max(newMin, this.defaultMinWidth);
      this.resize();
    }
  }

  get value() {
    return this.state.inputValue;
  }

  get placeholder() {
    return this.getAttribute(`placeholder`);
  }

  get defaultMinWidth() {
    const minWidth = Number(this.getAttribute(`min-width`));
    return Number.isInteger(minWidth) ? minWidth : GLOBAL_MIN_WIDTH;
  }

  set value(inputValue) {
    this.update({inputValue});
    this.resize();
  }
}

document.registerElement(`resize-input`, ResizeInput);

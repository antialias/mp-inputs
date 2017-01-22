import { Component } from 'panel';

import template from './resize-input.jade';

const GLOBAL_MIN_WIDTH = 100;
const SIZER_PROPS = [
  `fontFamily`,
  `fontSize`,
  `fontWeight`,
  `height`,
  `letterSpacing`,
  `padding`,
  `whiteSpace`,
];

document.registerElement(`resize-input`, class extends Component {
  get config() {
    return {
      template,
      defaultState: {
        autofocus: true,
        inputValue: ``,
        inputWidth: GLOBAL_MIN_WIDTH,
      },
      helpers: {
        inserted: vnode => requestAnimationFrame(() => vnode.elm.focus()),
        updatedInput: ev => this.value = ev.target.value,
      },
    };
  }

  createdCallback() {
    super.createdCallback(...arguments);
    this.minimumWidth = GLOBAL_MIN_WIDTH;
  }

  attachedCallback() {
    super.attachedCallback(...arguments);
    this.removeSizer();
    this.setMinimumWidth(this.getTextWidth(this.getAttribute(`placeholder`)));
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

  getTextWidth(text) {
    if (!this.sizer) {
      this.sizer = document.createElement(`div`);

      const tmpInput = document.createElement(`input`);
      this.appendChild(tmpInput);
      const thisStyle = getComputedStyle(tmpInput);
      for (let prop of SIZER_PROPS) {
        this.sizer.style[prop] = thisStyle[prop];
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
    this.sizer.innerHTML = text && text.replace(` `, `&nbsp;`);
    return Math.round(this.sizer.getBoundingClientRect().width);
  }

  resize() {
    const newWidth = Math.max(this.minimumWidth, this.getTextWidth(this.state.inputValue));
    this.update({inputWidth: newWidth});

    // don't wait for animation frame if input is already available
    const input = this.el.querySelector(`input`);
    if (input) {
      input.style.width = `${newWidth}px`;
    }
  }

  setMinimumWidth(newMin) {
    if (newMin !== this.minimumWidth) {
      this.minimumWidth = Math.max(newMin, GLOBAL_MIN_WIDTH);
      this.resize();
    }
  }

  get value() {
    return this.state.inputValue;
  }

  set value(inputValue) {
    this.update({inputValue});
    this.resize();
  }
});

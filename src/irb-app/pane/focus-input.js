import WebComponent from 'webcomponent';

const CHANGE_EVENTS = ['blur', 'change', 'focusout', 'input', 'keypress'];

document.registerElement('focus-input', class extends WebComponent {
  createdCallback() {
    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.value = this.value;
    if (this.placeholder) {
      this.inputEl.placeholder = this.placeholder;
    }
  }

  attachedCallback() {
    this.changeHandler = () => this.dispatchChange();
    CHANGE_EVENTS.forEach(evName => this.inputEl.addEventListener(evName, this.changeHandler));

    this.appendChild(this.inputEl);
    this.focusInputEl();
  }

  /* TODO: this should work so we don't need to recreate inputs every time we need to focus
  static get observedAttributes() {
    return ['autoFocus'];
  }

  attributeChangedCallback() {
    this.focusInputEl();
  }
  */

  attributeChangedCallback() {
    this.placeholder = this.getAttribute('placeholder');
    if (this.placeholder) {
      this.inputEl.placeholder = this.placeholder;
    }
  }

  detachedCallback() {
    CHANGE_EVENTS.forEach(evName => this.inputEl.removeEventListener(evName, this.changeHandler));
  }

  dispatchChange() {
    this.dispatchEvent(new CustomEvent('change', {'detail': this.inputEl.value}));
  }

  get value() {
    return this.inputEl.value;
  }

  set value(val) {
    if (val !== this.inputEl.value) {
      this.inputEl.value = val;
    }
  }

  focusInputEl() {
    if (this.autoFocus) {
      if (this.focusDelay || this.focusDelay === 0) {
        setTimeout(() => this.inputEl.focus(), this.focusDelay);
      } else {
        this.inputEl.focus();
      }
    }
  }
});

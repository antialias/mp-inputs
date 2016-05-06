import WebComponent from 'webcomponent';

const CHANGE_EVENTS = ['blur', 'change', 'focusout', 'input', 'keypress'];

class FocusInput extends WebComponent {
  createdCallback() {
    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.value = this.value;
  }

  attachedCallback() {
    this.changeHandler = () => this.dispatchChange();
    CHANGE_EVENTS.forEach(evName => this.inputEl.addEventListener(evName, this.changeHandler));
    this.appendChild(this.inputEl);
    this.focusInputEl();
  }

  attributeChangedCallback() {
    this.focusInputEl();
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
      this.resize();
    }
  }

  focusInputEl() {
    if (this.focus) {
      setTimeout(() => this.inputEl.focus(), 0);
    }
  }
}

export default function register() {
  document.registerElement('focus-input', FocusInput);
}

import WebComponent from 'webcomponent';

const CHANGE_EVENTS = ['blur', 'change', 'focusout', 'input', 'keypress'];

document.registerElement('auto-sizing-input', class extends WebComponent {
  createdCallback() {
    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.value = this.value;
    this.inputEl.maxLength = 50;
  }

  attachedCallback() {
    let divEl = document.createElement('div');
    divEl.classList.add('panel-input-wrapper');
    divEl.appendChild(this.inputEl);

    // autosize to text
    this.inputSizer = document.createElement('div');
    this.inputSizer.style.fontFamily = '\'Helvetica Neue\', Helvetica, Arial, sans-serif';
    this.inputSizer.style.fontSize = '20px';
    this.inputSizer.style.fontWeight = '600';
    this.inputSizer.style.height = 'auto';
    this.inputSizer.style.letterSpacing = '0.03em';
    this.inputSizer.style.padding = '8px';
    this.inputSizer.style.position = 'absolute';
    this.inputSizer.style.visibility = 'hidden';
    this.inputSizer.style.whiteSpace = 'no-wrap';
    this.inputSizer.style.width = 'auto';
    this.inputSizer.innerHTML = this.value.replace(' ', '&nbsp');
    document.body.appendChild(this.inputSizer);
    this.inputEl.style.width = `${this.inputSizer.clientWidth}px`;

    this.changeHandler = () => this.resize();
    this.focusHandler = () => this.dispatchEvent(new CustomEvent('focus'));
    this.blurHandler = () => this.dispatchEvent(new CustomEvent('blur'));
    CHANGE_EVENTS.forEach(evName => this.inputEl.addEventListener(evName, this.changeHandler));
    this.inputEl.addEventListener('focus', this.focusHandler);
    this.inputEl.addEventListener('blur', this.blurHandler);

    this.appendChild(divEl);
  }

  detachedCallback() {
    CHANGE_EVENTS.forEach(evName => this.inputEl.removeEventListener(evName, this.changeHandler));
    this.inputEl.removeEventListener('focus', this.focusHandler);
    this.inputEl.removeEventListener('blur', this.blurHandler);
    this.inputSizer.remove();
  }

  resize() {
    if (this.inputSizer) {
      this.inputSizer.innerHTML = this.value.replace(' ', '&nbsp');
      this.inputEl.style.width = `${this.inputSizer.clientWidth}px`;
      this.dispatchEvent(new CustomEvent('change', {'detail': this.inputEl.value}));
    }
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
});

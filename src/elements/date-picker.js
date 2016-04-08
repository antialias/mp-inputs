class DatePicker extends HTMLElement {
  createdCallback() {
    this.$el = $('<div>').appendTo(this);
  }

  attachedCallback() {
    this.$el
      .MPDatepicker()
      .on('change', () => this.dispatchEvent(new Event('change')));
  }

  get value() {
    return this.$el.val();
  }

  set value(value) {
    let { from, to } = JSON.parse(value);
    let formattedValue = {from: new Date(from), to: new Date(to)};

    if (formattedValue !== this.$el.val()) {
      this.$el.val(formattedValue);
    }
  }
}

export function register() {
  document.registerElement('irb-date-picker', DatePicker);
}

/* global $ */

import WebComponent from 'webcomponent';

document.registerElement('date-picker', class extends WebComponent {
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
    const { from, to } = JSON.parse(value);
    const formattedValue = {from: new Date(from), to: new Date(to)};

    if (formattedValue !== this.$el.val()) {
      this.$el.val(formattedValue);
    }
  }
});

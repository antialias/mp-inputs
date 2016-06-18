import Pikaday from 'pikaday';
import WebComponent from 'webcomponent';

import './mp-calendar.styl';

document.registerElement('mp-calendar', class extends WebComponent {
  attachedCallback() {
    this.inputEl = document.createElement('input');
    this.inputEl.className = 'mp-pikaday-input';

    this.picker = new Pikaday({
      field: this.inputEl,
      container: document.getElementsByClassName('calendar-hook')[0],
      onSelect: date => {
        console.log('Selected', date);
        this.dispatchEvent(new Event('change', {detail: date}));
      },
    });

    this.appendChild(this.inputEl);
    this.inputEl.focus();
  }

  // get value() {
  //   return this.$el.val();
  // }

  // set value(value) {
  //   const { from, to } = JSON.parse(value);
  //   const formattedValue = {from: new Date(from), to: new Date(to)};

  //   if (formattedValue !== this.$el.val()) {
  //     this.$el.val(formattedValue);
  //   }
  // }
});

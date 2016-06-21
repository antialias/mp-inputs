import Pikaday from 'pikaday';
import WebComponent from 'webcomponent';

import './mp-calendar.styl';

document.registerElement('mp-calendar', class extends WebComponent {
  attachedCallback() {
    this.inputEl = document.createElement('input');
    this.inputEl.className = 'mp-pikaday-input';

    this.picker = new Pikaday({
      container: document.getElementsByClassName('calendar-hook')[0],
      field: this.inputEl,
      numberOfMonths: 2,
      onSelect: date =>
        this.dispatchEvent(new CustomEvent('change', {detail: date.toISOString().slice(0, 10)})),
    });

    this.appendChild(this.inputEl);
    this.inputEl.focus();
  }
});

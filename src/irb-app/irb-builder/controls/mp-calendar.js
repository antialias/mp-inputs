import Pikaday from 'pikaday';
import WebComponent from 'webcomponent';

document.registerElement('mp-calendar', class extends WebComponent {
  attachedCallback() {
    this.picker = new Pikaday({
      onSelect: date => {
        console.log('Selected', date);
        this.dispatchEvent(new Event('change', {detail: date}));
      },
    });
    this.appendChild(this.picker.el);
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

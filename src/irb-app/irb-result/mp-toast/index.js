import { Component } from 'panel';

import template from './index.jade';

import './index.styl';

document.registerElement('mp-toast', class extends Component {
  attributeChangedCallback() {
    if (this.getAttribute('showToast') === 'true') {
      this.update({showToast: true});
    }
  }

  get config() {
    return {
      defaultState: {
        showToast: false,
      },
      helpers: {
        eatToast: () => {
          this.update({showToast: false});
          this.dispatchEvent(new Event('select'));
        },
        getMessage: () => this.getAttribute('message'),
        getSelectText: () => this.getAttribute('select-text'),
        trashToast: () => {
          this.update({showToast: false});
          this.dispatchEvent(new Event('close'));
        },
      },
      template,
    };
  }
});

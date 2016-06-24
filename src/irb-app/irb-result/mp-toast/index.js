import { Component } from 'panel';

import template from './index.jade';

import './index.styl';

document.registerElement('mp-toast', class extends Component {
  get config() {
    return {
      helpers: {
        eatToast: () => this.dispatchEvent(new Event('select')),
        getMessage: () => this.getAttribute('message'),
        getSelectText: () => this.getAttribute('select-text'),
        trashToast: () => this.dispatchEvent(new Event('close')),
      },
      template,
    };
  }
});

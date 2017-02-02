import { Component } from 'panel';

import css from './mp-drawer.styl';
import template from './mp-drawer.jade';

document.registerElement(`mp-drawer`, class extends Component {
  get config() {
    return {
      css,
      template,
      useShadowDom: true,

      defaultState: {
        delayRemove: 250, // TODO replace with var once in common
      },

      helpers: {
        close: () => this.dispatchEvent(new CustomEvent(`close`)),
      },
    };
  }

  attachedCallback() {
    if (this.initialized) {
      return;
    }

    if (!this.elementMoved) {
      this.elementMoved = true;
      document.body.style.position = `relative`;
      document.body.appendChild(this);
    }

    super.attachedCallback(...arguments);
  }
});

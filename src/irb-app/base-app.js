import { Component } from 'panel';

import { mirrorLocationHash } from '../mp-common/parent-frame';
import { debug } from '../util';

export default class BaseApp extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);

    // initialize frame communication
    if (this.parentFrame) {
      mirrorLocationHash(this.parentFrame);
    }

    this.initClickOutside();
  }

  update(stateUpdate={}) {
    debug.info('applying update ->', stateUpdate);
    super.update(...arguments);
    debug.info('      new state ->', this.state);
  }

  // DOM helpers

  initClickOutside() {
    document.addEventListener('click', ev => this.clickOutsideHandler(ev));

    if (this.parentFrame) {
      this.parentFrame.addHandler('click', ev => this.clickOutsideHandler(ev));
    }
  }

  onClickOutside(tagName, appMethodName) {
    this.clickOutsideHandlers = this.clickOutsideHandlers || {};
    this.clickOutsideHandlers[appMethodName] = this.clickOutsideHandlers[appMethodName] || [];

    if (this.clickOutsideHandlers[appMethodName].indexOf(tagName) === -1) {
      this.clickOutsideHandlers[appMethodName].push(tagName);
    }
  }

  clickOutsideHandler(ev) {
    this.clickOutsideHandlers = this.clickOutsideHandlers || {};
    Object.keys(this.clickOutsideHandlers).forEach(appMethodName => {
      const tagNames = this.clickOutsideHandlers[appMethodName];

      for (let el = ev.target; el; el = el.parentElement) {
        if (tagNames.includes(el.tagName)) {
          return;
        }
      }

      this[appMethodName](ev);
    });
  }
}

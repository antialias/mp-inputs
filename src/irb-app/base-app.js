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
    document.addEventListener('click', event => this.clickOutsideHandler(event));

    if (this.parentFrame) {
      this.parentFrame.addHandler('click', event => this.clickOutsideHandler(event));
    }
  }

  onClickOutside(elementClass, appMethodName) {
    this.clickOutsideHandlers = this.clickOutsideHandlers || {};
    this.clickOutsideHandlers[appMethodName] = this.clickOutsideHandlers[appMethodName] || [];

    if (this.clickOutsideHandlers[appMethodName].indexOf(elementClass) === -1) {
      this.clickOutsideHandlers[appMethodName].push(elementClass);
    }
  }

  clickOutsideHandler(event) {
    this.clickOutsideHandlers = this.clickOutsideHandlers || {};
    Object.keys(this.clickOutsideHandlers).forEach(appMethodName => {
      const classes = this.clickOutsideHandlers[appMethodName];

      for (let el = event.target; el; el = el.parentElement) {
        for (let i = 0; i < classes.length; i++) {
          if (el.classList.contains(classes[i])) {
            return;
          }
        }
      }

      this[appMethodName](event);
    });
  }
}

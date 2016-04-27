import { App, Router } from 'panel';

import { mirrorLocationHash } from './mp-common/parent-frame';
import { debug } from './util';

export default class BaseApp extends App {
  constructor(elID, initialState={}, options={}) {
    super(...arguments);

    // initialize frame communication
    if (options.parentFrame) {
      this.parentFrame = options.parentFrame;
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
    Object.keys(this.clickOutsideHandlers).forEach(appMethodName => {
      let el = event.target;
      const classes = this.clickOutsideHandlers[appMethodName];

      do {
        for (let i = 0; i < classes.length; i++) {
          if (el.classList.contains(classes[i])) {
            return;
          }
        }
      } while (el = el.parentElement);

      this[appMethodName](event);
    });
  }
}

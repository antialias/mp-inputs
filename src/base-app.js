import { App, Router } from 'panel';

import { mirrorLocationHash } from './mp-common/parent-frame';

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
    if (APP_ENV === 'development') {
      console.info('applying update ->', stateUpdate);
    }

    super.update(...arguments);

    if (APP_ENV === 'development') {
      console.info('      new state ->', this.state);
    }
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
    let el = event.target;

    Object.keys(this.clickOutsideHandlers).forEach(appMethodName => {
      let classes = this.clickOutsideHandlers[appMethodName];

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

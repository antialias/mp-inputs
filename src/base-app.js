import { App, Router } from 'panel';

import { mirrorLocationHash } from './mp-common/parent-frame';

export default class BaseApp extends App {
  constructor(elID, initialState={}, options={}) {
    super(...arguments)

    // initialize frame communication
    if (options.parentFrame) {
      this.parentFrame = attrs.parentFrame;
      mirrorLocationHash(this.parentFrame);
    }

    this.initClickOutside();
  }

  update(stateUpdate={}) {
    super.update(...arguments);
    console.log(this.state);
  }

  // DOM helpers

  initClickOutside() {
    document.addEventListener('click', event => this.clickOutsideHandler(event));

    if (this.parentFrame) {
      this.parentFrame.addHandler('click', event => this.clickOutsideHandler(event));
    }
  }

  onClickOutside(elementClass, handler) {
    this.clickOutsideClasses = (this.clickOutsideClasses || []).concat([elementClass]);
    this.clickOutsideHandlers = (this.clickOutsideHandlers || []).concat([handler]);
  }

  clickOutsideHandler(event) {
    let el = event.target;

    do {
      for (let i = 0; i < this.clickOutsideClasses.length; i++) {
        if (el.classList.contains(this.clickOutsideClasses[i])) {
          return;
        }
      }
    } while (el = el.parentElement);

    for (let i = 0; i < this.clickOutsideHandlers.length; i++) {
      this.clickOutsideHandlers[i](event);
    }
  }
}


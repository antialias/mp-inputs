import { Component } from 'panel';

import { mirrorLocationHash } from '../mp-common/parent-frame';
import { debug } from '../util';

export default class BaseApp extends Component {
  attachedCallback() {
    Object.assign(this.state, this.deserialize(window.localStorage.getItem('foobar')));

    super.attachedCallback(...arguments);

    // initialize frame communication
    if (this.parentFrame) {
      mirrorLocationHash(this.parentFrame);
    }

    this.initClickOutside();
  }

  setParentFrame(parentFrame, parentData) {
    this.parentFrame = parentFrame;
    this.parentData = parentData;
  }

  update(stateUpdate={}) {
    debug.info('applying update ->', stateUpdate);
    super.update(...arguments);
    debug.info('      new state ->', this.state);
    window.localStorage.setItem('foobar', this.serialize()); // FIXME foobar
  }

  // serialization helpers

  serialize() {
    return JSON.stringify(this.toSerializationAttrs());
  }

  deserialize(JSONstr) {
    let persisted = null;
    try {
      persisted = this.fromSerializationAttrs(JSON.parse(JSONstr));
    } catch(err) {
      console.error('Invalid persistence entry');
    }
    return persisted || {};
  }

  toSerializationAttrs() {
    return {};
  }

  fromSerializationAttrs(attrs) {
    return attrs;
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

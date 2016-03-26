import { App } from 'panel';
import { mirrorLocationHash } from './mp-common/parent-frame';

import IrbView from './views/irb';
import { extend } from './util';

import './stylesheets/app.styl';

export default class IrbApp extends App {
  constructor(elID, initialState={}, attrs={}) {
    super(...arguments);

    // initialize frame communication
    if (attrs.parentFrame) {
      this.parentFrame = attrs.parentFrame;
      mirrorLocationHash(this.parentFrame);
    }
  }

  get SCREENS() {
    return {
      main: new IrbView(),
    };
  }

  main(state={}) {
    this.update({$screen: 'main'});
  }
}

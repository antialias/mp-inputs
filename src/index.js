/* global APP_ENV */

// polyfills, must import first
import 'babel-polyfill';
import 'webcomponents.js/webcomponents-lite';

import Framesg from 'framesg';

import './irb-app';

import './stylesheets/index.styl';

if (APP_ENV === 'development') {
  window.MP.api.options.apiHost = window.location.origin;
}

const initIRB = () => new Promise(resolve => {
  const IRB = document.createElement('irb-app');
  if (window.parent !== window) {
    const parentFrame = new Framesg(window.parent, 'mp-app', {
      startApp: () => {
        IRB.parentFrame = parentFrame;
        resolve(IRB);
      },
    });
  } else {
    resolve(IRB);
  }
});

initIRB().then(IRB => document.getElementById('app').appendChild(IRB));

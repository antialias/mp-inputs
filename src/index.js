/* global API_LOCAL */

// polyfills, must import first
import 'babel-polyfill';
import 'webcomponents.js/webcomponents-lite';

import Framesg from 'framesg';

import './irb-app';

import './stylesheets/index.styl';

const STANDALONE = window.parent === window;

if (API_LOCAL && !STANDALONE) {
  window.MP.api.options.apiHost = window.location.origin;
}

const initIRB = () => new Promise(resolve => {
  const IRB = document.createElement('irb-app');
  if (STANDALONE) {
    resolve(IRB);
  } else {
    const parentFrame = new Framesg(window.parent, 'mp-app', {
      startApp: () => {
        IRB.parentFrame = parentFrame;
        resolve(IRB);
      },
    });
  }
});

initIRB().then(IRB => document.getElementById('app').appendChild(IRB));

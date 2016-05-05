/* global APP_ENV */

import 'babel-polyfill';
import Framesg from 'framesg';

import IRBApp from './app';

import './stylesheets/index.styl';

if (APP_ENV === 'development') {
  window.MP.api.options.apiHost = window.location.origin;
}

if (window.parent !== window) {
  const parentFrame = new Framesg(window.parent, 'mp-app', {
    startApp: () => {
      new IRBApp('app', null, {parentFrame}).update();
    },
  });
} else {
  new IRBApp('app').update();
}

/* global APP_ENV */

import 'babel-polyfill';
import Framesg from 'framesg';

import IRBApp from './app';
import { extend } from './util';
import { mixpanel } from './tracking';
import { IS_WITHIN_MP_PLATFORM_IFRAME } from './constants';

import './stylesheets/index.styl';

//if (APP_ENV === 'development') {
//  window.MP.api.options.apiHost = window.location.origin;
//}

if (IS_WITHIN_MP_PLATFORM_IFRAME) {
  const parentFrame = new Framesg(window.parent, 'mp-app', {
    startApp: parentData => {
      new IRBApp('app', null, {parentFrame}).update();
    },
  });
} else {
  new IRBApp('app').update();
}

import 'babel-polyfill';
import Framesg from 'framesg';

import IrbApp from './app';
import { extend } from './util';
import { mixpanel } from './tracking';
import { IS_WITHIN_MP_PLATFORM_IFRAME } from './constants';

import './stylesheets/index.styl';

if (IS_WITHIN_MP_PLATFORM_IFRAME) {
  const parentFrame = new Framesg(window.parent, 'irb', {
    startApp: parentData => {
      let app = new IrbApp('app', null, {parentFrame});
      window.history.replaceState(null, null, parentData.hash.replace(/^#*/, '#'));
      app.update();
    },
  });
} else {
  new IrbApp('app').update();
}

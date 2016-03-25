import 'babel-polyfill';
import Framesg from 'framesg';

import IrbApp from './app';
import { extend } from './util';
import { mixpanel } from './tracking';
import {
  IS_WITHIN_MP_PLATFORM_IFRAME,
  MATH_TOTAL,
  RESOURCE_EVENTS,
  RESOURCE_VALUE_ALL,
  SCREEN_MAIN
} from './constants';

import './stylesheets/index.styl';

function createApp(attrs={}) {
  const initialState = {
    $screen: SCREEN_MAIN,
    reportName: 'Untitled report',
    show: [{
      filter: '',
      math: MATH_TOTAL,
      resource_type: RESOURCE_EVENTS,
      resource_value: RESOURCE_VALUE_ALL,
    }],
    time: {
      unit: TIME_UNIT_HOUR,
      start: -96,
      end: 0,
    },
    group: [],
  };

  return new IrbApp('app', initialState, attrs);
}

if (IS_WITHIN_MP_PLATFORM_IFRAME) {
  const parentFrame = new Framesg(window.parent, 'irb', {
    startApp: parentData => {
      let app = createApp({parentFrame});
      window.history.replaceState(null, null, parentData.hash.replace(/^#*/, '#'));
      app.update();
    },
  });
} else {
  createApp().update();
}

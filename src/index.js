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
  SCREEN_MAIN,
  TIME_UNIT_HOUR,
} from './constants';

import './stylesheets/index.styl';

function createApp(attrs={}) {
  const initialState = {
    $screen: SCREEN_MAIN,
    reportName: 'Untitled report',
    comparisons: [{
      math: MATH_TOTAL,
      type: RESOURCE_EVENTS,
      value: RESOURCE_VALUE_ALL,
      filter: '',
    }],
    time: {
      unit: TIME_UNIT_HOUR,
      start: -96,
      end: null,
    },
    groups: [],
    filters: [],
    editing_builder_section: null,
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

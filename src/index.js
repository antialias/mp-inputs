/* global API_LOCAL */

// polyfills, must import first
import 'babel-polyfill';
import 'webcomponents.js/webcomponents-lite';

import Framesg from 'framesg';

import { mixpanel, rollbar } from './tracking';

import './irb-app';

import 'mixpanel-common/stylesheets/defaults/index.styl';
import './stylesheets/index.styl';

const STANDALONE = window.parent === window;

if (API_LOCAL && !STANDALONE) {
  window.MP.api.options.apiHost = window.location.origin;
}
window.MP.api.MAX_SIMULTANEOUS_QUERIES = 50;

const initIRB = () => new Promise(resolve => {
  const IRB = document.createElement(`irb-app`);
  if (STANDALONE) {
    IRB.standalone = true;
    resolve(IRB);
  } else {
    const parentFrame = new Framesg(window.parent, `mp-app`, {
      startApp: parentData => {
        mixpanel.identify(parentData.user_id);
        mixpanel.register({
          'Email':      parentData.user_email,
          'Project ID': parentData.project_id,
          'User ID':    parentData.user_id,
        });
        mixpanel.track(`Viewed report`);
        mixpanel.people.set({
          '$email': parentData.user_email,
          '$name': parentData.user_name,
        });
        rollbar.configure({
          payload: {
            person: {
              id: parentData.user_id,
              email: parentData.user_email,
            },
          },
        });

        IRB.setParentFrame(parentFrame, parentData);
        resolve(IRB);
      },
    });
  }
});

initIRB().then(IRB => document.getElementById(`app`).appendChild(IRB));

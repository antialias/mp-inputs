/* global API_LOCAL */

// polyfills, must import first
// TODO load only in standalone mode
// import 'babel-polyfill';
// import 'whatwg-fetch';
// import 'webcomponents.js/webcomponents';
// import '../standalone/highcharts.src';

import { STANDALONE, getMPData } from './mp-context';
import { mixpanel, rollbar } from './tracking';
import { parseURLQueryParams } from './util';

// import 'mixpanel-common/components';
import './irb-app';

import './stylesheets/index.styl';


const initIRB = () => new Promise(resolve => {
  const IRB = document.createElement(`irb-app`);
  IRB.apiHost = `https://mixpanel.com`;

  if (STANDALONE) {
    IRB.standalone = true;

    const queryParams = parseURLQueryParams();
    IRB.apiKey = queryParams.api_key;
    IRB.apiSecret = queryParams.api_secret;

    resolve(IRB);
  } else {

    const mpData = getMPData();
    IRB.apiKey = mpData.apiKey;
    IRB.apiSecret = mpData.apiSecret;
    if (API_LOCAL) {
      IRB.apiHost = window.location.origin;
    }



    resolve(IRB);

    // const parentFrame = new Framesg(window.parent, `mp-app`, {
    //   startApp: parentData => {

    //     IRB.apiKey = window.parent.mp.report.globals.api_key;
    //     IRB.apiSecret = window.parent.mp.report.globals.api_secret;

    //     mixpanel.identify(parentData.user_id);
    //     mixpanel.register({
    //       'Email':      parentData.user_email,
    //       'Project ID': parentData.project_id,
    //       'User ID':    parentData.user_id,
    //     });
    //     mixpanel.track(`Viewed report`);
    //     mixpanel.people.set({
    //       '$email': parentData.user_email,
    //       '$name': parentData.user_name,
    //     });
    //     rollbar.configure({
    //       payload: {
    //         person: {
    //           id: parentData.user_id,
    //           email: parentData.user_email,
    //         },
    //       },
    //     });

    //     IRB.setParentFrame(parentFrame, parentData);
    //     resolve(IRB);
    //   },
    // });

  }
});

initIRB().then(IRB => {
  const appContainer = document.getElementById(`mixpanel-application`);
  appContainer.innerHTML = ``;
  appContainer.appendChild(IRB);
});

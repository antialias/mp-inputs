import 'mixpanel-common/components';
import 'mixpanel-common/widgets';

import MPContext from './mp-context';
import { mixpanel, rollbar } from './tracking';
import { parseURLQueryParams } from './util';

import './insights-app';

import './stylesheets/index.styl';


const initInsights = () => new Promise(resolve => {
  const app = document.createElement(`insights-app`);

  const mpContext = new MPContext();
  app.apiHost = mpContext.apiHost;

  if (mpContext.standalone) {

    const queryParams = parseURLQueryParams();
    app.apiKey = queryParams.api_key;
    app.apiSecret = queryParams.api_secret;
    app.setMPContext(mpContext);

    // TODO DEBUG CODE - remove when we switch fully to new Insights API
    app.useNewApi = mpContext.useNewApi;
    app.compareApis = mpContext.compareApis;
    app.newApiBackground = mpContext.newApiBackground;
    // END DEBUG CODE

    resolve(app);

  } else {

    app.apiKey = mpContext.apiKey;
    app.apiSecret = mpContext.apiSecret;
    app.setMPContext(mpContext);

    // TODO DEBUG CODE - remove when we switch fully to new Insights API
    if (app.hasWhitelist(`dev`)) {
      app.useNewApi = mpContext.useNewApi;
      app.compareApis = mpContext.compareApis;
      app.newApiBackground = mpContext.newApiBackground;
    } else {
      // make background requests to new api for all non-staff users for load test purposes
      app.newApiBackground = true;
    }
    // END DEBUG CODE

    mixpanel.identify(mpContext.userID);
    mixpanel.register({
      'Email':      mpContext.userEmail,
      'Project ID': mpContext.projectID,
      'User ID':    mpContext.userID,
    });
    mixpanel.track(`Viewed report`);
    mixpanel.people.set({
      '$email': mpContext.userEmail,
      '$name': mpContext.userName,
    });
    rollbar.configure({
      payload: {
        person: {
          id: mpContext.userID,
          email: mpContext.userEmail,
        },
      },
    });
    resolve(app);

  }
});

export default initInsights;

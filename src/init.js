import MPContext from './mp-context';
import { mixpanel, rollbar } from './tracking';
import { parseURLQueryParams } from './util';

import './insights-app';

import './stylesheets/index.styl';


const initInsights = () => new Promise(resolve => {
  const Insights = document.createElement(`insights-app`);

  const mpContext = new MPContext();
  Insights.apiHost = mpContext.apiHost;

  if (mpContext.standalone) {

    const queryParams = parseURLQueryParams();
    Insights.apiKey = queryParams.api_key;
    Insights.apiSecret = queryParams.api_secret;
    Insights.setMPContext(mpContext);
    resolve(Insights);

  } else {

    Insights.apiKey = mpContext.apiKey;
    Insights.apiSecret = mpContext.apiSecret;
    Insights.setMPContext(mpContext);

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
    resolve(Insights);

  }
});

export default initInsights;

import MPContext from './mp-context';
import { mixpanel, rollbar } from './tracking';
import { parseURLQueryParams } from './util';

import './irb-app';

import './stylesheets/index.styl';


const initIRB = () => new Promise(resolve => {
  const IRB = document.createElement(`irb-app`);

  const mpContext = new MPContext();
  IRB.apiHost = mpContext.apiHost;

  if (mpContext.standalone) {

    const queryParams = parseURLQueryParams();
    IRB.apiKey = queryParams.api_key;
    IRB.apiSecret = queryParams.api_secret;
    IRB.setMPContext(mpContext);
    resolve(IRB);

  } else {

    IRB.apiKey = mpContext.apiKey;
    IRB.apiSecret = mpContext.apiSecret;
    IRB.setMPContext(mpContext);

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
    resolve(IRB);

  }
});

export default initIRB;

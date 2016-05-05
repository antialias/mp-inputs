/* global APP_ENV, MIXPANEL_TOKEN, ROLLBAR_TOKEN */

import mixpanel from 'mixpanel-browser';
import rollbarConfig from 'rollbar-browser';

mixpanel.init(MIXPANEL_TOKEN, {
  debug: APP_ENV === 'development',
  persistence: 'localStorage',
});

const rollbar = rollbarConfig.init({
  accessToken: ROLLBAR_TOKEN,
  captureUncaught: true,
  payload: {
    environment: APP_ENV,
  },
});

export {mixpanel, rollbar};

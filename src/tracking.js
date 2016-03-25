/* global APP_ENV */

import mixpanel from 'mixpanel-browser';
import rollbarConfig from 'rollbar-browser';

if (APP_ENV === 'development') {
  // Project 132990 Mixpanel Dev
  mixpanel.init('9c4e9a6caf9f429a7e3821141fc769b7', {
    debug: true,
    persistence: 'localStorage',
  });
} else {
  // Project 904823 Query Console
  mixpanel.init('a0a2beb940bb3eef7b8e209693ac789b', {
    persistence: 'localStorage',
  });
}

const rollbar = rollbarConfig.init({
  accessToken: '1a56042377784d39b0e188b601e3d902',
  captureUncaught: true,
  payload: {
    environment: APP_ENV,
  },
});

export {mixpanel, rollbar};

/* global MIXPANEL_TOKEN, ROLLBAR_TOKEN */

import { initMixpanel, initRollbar } from 'mixpanel-common/build/report/tracking-setup';

export const mixpanel = initMixpanel(MIXPANEL_TOKEN);
export const rollbar = initRollbar(ROLLBAR_TOKEN);

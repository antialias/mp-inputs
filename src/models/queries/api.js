// TODO ensure fetch polyfill in IRB standalone

import { objToQueryString } from 'mixpanel-common/util';

export default function queryMP(endpoint, secret, params) {
  return fetch(`${MP.api.options.apiHost}/api/2.0/${endpoint}?${objToQueryString(params)}`, {
    headers: {
      Authorization: `Basic ${btoa(secret + `:`)}`,
    },
    method: `GET`,
  })
    .then(response => {
      if (response.status < 400 || response.body) {
        return response.json();
      } else {
        return {error: response.statusText};
      }
    });
}

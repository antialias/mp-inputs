// TODO ensure fetch polyfill in IRB standalone

import { objToQueryString } from 'mixpanel-common/util';

export default function queryMP(endpoint, secret, params, options={}) {
  return fetch(`${MP.api.options.apiHost}/${endpoint}?${objToQueryString(params)}`, Object.assign({
    headers: {
      Authorization: `Basic ${btoa(secret + `:`)}`,
    },
    method: `GET`,
  }, options))
    .then(response => {
      if (response.status < 400 || response.body) {
        return response.json();
      } else {
        return {error: response.statusText};
      }
    })
    .catch(e => console.error(`Error fetching ${endpoint}`, e));
}

import fetch from 'node-fetch';

import { API_BASE, authHeader, urlencodeParams } from './util';

class JQXHRPromise extends Promise {}
// to support chaining
JQXHRPromise.prototype.done = Promise.prototype.then;
JQXHRPromise.prototype.fail = Promise.prototype.catch;

global.MP = {
  // stub the MP.api.query in mixpanel-platform since it doesn't support server side but we need it
  // for extrema
  api: {
    query: function(endpoint, params) {
      return new JQXHRPromise((resolve, reject) => {
        fetch(`${API_BASE}/${endpoint}?${urlencodeParams(params)}`,
              // expect apiSecret to be injected in.
              { headers: { 'Authorization': authHeader(global.MP.apiSecret) }})
        .then(res => res.json())
        .then(resolve).catch(reject);
      });
    },
  },
};

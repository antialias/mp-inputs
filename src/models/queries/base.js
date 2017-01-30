// TODO ensure fetch polyfill in IRB standalone

import { objToQueryString } from 'mixpanel-common/util';

export default class BaseQuery {
  constructor(apiAttrs, options={}) {
    this.query = null; // used to check for obsolete queries
    this.apiHost = apiAttrs.apiHost;
    this.apiSecret = apiAttrs.apiSecret;

    if (!this.apiHost) {
      throw new Error(`apiHost required for Query!`);
    }
    if (!this.apiSecret) {
      throw new Error(`apiSecret required for Query!`);
    }
    for (let attr of Object.keys(options)) {
      this[attr] = options[attr];
    }
  }

  build(state, options) {
    this.query = this.buildQuery(state, options);
    return this;
  }

  run(cachedResult) {
    const query = this.query;

    return new Promise((resolve, reject) => {
      if (this.valid) {
        if (cachedResult) {
          resolve(cachedResult);
        } else {
          this.executeQuery()
            .then(rawResults => {
              if (query === this.query) { // ignore obsolete queries
                resolve(this.processResults(rawResults));
              }
            })
            .catch(reject);
        }
      } else {
        resolve(this.processResults(null));
      }
    });
  }

  get valid() {
    return true;
  }

  buildOptions() {
    return {};
  }

  buildParams() {
    return {};
  }

  buildQuery() {
    return {};
  }

  buildUrl() {
    return ``;
  }

  executeQuery() {
    return this.fetch(this.buildUrl(), this.buildParams(), this.buildOptions());
  }

  fetch(endpoint, params, queryOptions) {
    const url = `${this.apiHost}/${endpoint}?${objToQueryString(params)}`;
    return fetch(url, Object.assign({
      headers: {
        Authorization: `Basic ${btoa(this.apiSecret + `:`)}`,
      },
      method: `GET`,
    }, queryOptions))
      .then(response => {
        if (response.status < 400 || response.body) {
          return response.json();
        } else {
          return {error: response.statusText};
        }
      })
      .catch(e => console.error(`Error fetching ${url}`, e));
  }

  // expected args: results, query (optional)
  processResults(results) {
    return results;
  }
}

// special string value used to mark pieces of state as "loading"
// while queries to populate the state are in flight
BaseQuery.LOADING = `$IRB_QUERY_LOADING`;

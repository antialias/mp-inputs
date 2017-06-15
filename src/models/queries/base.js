/* global mp */

import {objToQueryString} from 'mixpanel-common/util';
import {DATASET_MIXPANEL} from '../constants';

export default class BaseQuery {
  constructor(apiAttrs, options={}) {
    this.requestMethod = `POST`;
    this.includeCredentials = false;

    // used to check for obsolete queries
    this.query = null;
    // if a newer query is made, should old results be ignored ?
    this.ignoreObsoleteResults = false;

    this.apiHost = apiAttrs.apiHost;
    this.apiSecret = apiAttrs.apiSecret;
    this.accessToken = apiAttrs.accessToken;
    this.projectId = apiAttrs.projectId;
    if (!this.apiHost) {
      throw new Error(`apiHost required for Query!`);
    }
    if (!this.apiSecret && !this.accessToken) {
      throw new Error(`apiSecret or accessToken required for Query!`);
    }
    if (this.accessToken && !this.projectId) {
      throw new Error(`projectId is required when using accessToken auth`);
    }
    for (let attr of Object.keys(options)) {
      this[attr] = options[attr];
    }
  }

  build(state, options={}) {
    this.query = this.buildQuery(state, options);

    if (options.dataset !== DATASET_MIXPANEL) {
      this.query.dataset = options.dataset;
    }

    return this;
  }

  run(cachedResult) {
    const originalQuery = this.query;

    return new Promise((resolve, reject) => {
      if (this.valid) {
        if (cachedResult) {
          resolve(cachedResult);
        } else {
          this.executeQuery()
            .then(rawResults => {
              if (!(this.ignoreObsoleteResults && this.query !== originalQuery)) {
                resolve(this.processResults(rawResults, originalQuery));
              }
            })
            .catch(reject);
        }
      } else {
        resolve(this.processResults(null, originalQuery));
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
    if (this.query.dataset) {
      params[`dataset_name`] = this.query.dataset;
    }

    let authHeader, url;
    if (this.apiSecret) {
      authHeader = `Basic ${btoa(this.apiSecret + `:`)}`;
      url = `${this.apiHost}/${endpoint}`;
    } else if (this.accessToken) {
      authHeader = `Bearer ${this.accessToken}`;
      url = `${this.apiHost}/${endpoint}?project_id=${this.projectId}`;
    }

    const fetchOptions = {
      headers: {
        Authorization: authHeader,
      },
      method: this.requestMethod,
    };

    if (this.requestMethod === `POST`) {
      fetchOptions.body = objToQueryString(params);
    }

    if (this.includeCredentials) {
      fetchOptions.credentials = `include`;
      fetchOptions.headers[`X-CSRFToken`] = mp.cookie.get(`csrftoken`);
    }

    return fetch(url, Object.assign(fetchOptions, queryOptions))
    .then(response => {
      if (response.ok || response.body) {
        return response.json();
      } else {
        this.handleFetchError(response.statusText);
        return {error: response.statusText};
      }
    })
    .catch(err => this.handleFetchError(err, url));
  }

  handleFetchError(error, url) {
    console.error(`Error fetching ${url}`, error);
  }

  // expected args: results, orignalQuery (optional)
  // WARNING: do not reference this.query in processResults as it may
  //          have changed since the corresponding request was fired
  processResults(results) {
    return results;
  }
}

// special string value used to mark pieces of state as "loading"
// while queries to populate the state are in flight
BaseQuery.LOADING = `$INSIGHTS_QUERY_LOADING`;

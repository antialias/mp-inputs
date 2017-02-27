import { objToQueryString } from 'mixpanel-common/util';

export default class BaseQuery {
  constructor(apiAttrs, options={}) {
    this.query = null; // used to check for obsolete queries
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
    let authHeader, url;
    if (this.apiSecret) {
      authHeader = `Basic ${btoa(this.apiSecret + `:`)}`;
      url = `${this.apiHost}/${endpoint}`;
    } else if (this.accessToken) {
      authHeader = `Bearer ${this.accessToken}`;
      url = `${this.apiHost}/${endpoint}?project_id=${this.projectId}`;
    }
    return fetch(url, Object.assign({
      headers: {
        Authorization: authHeader,
      },
      method: `POST`,
      body: objToQueryString(params),
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
BaseQuery.LOADING = `$INSIGHTS_QUERY_LOADING`;

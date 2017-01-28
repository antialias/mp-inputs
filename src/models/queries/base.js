/* global MP */

import queryMP from './api';

export default class BaseQuery {
  constructor() {
    this.query = null; // used to check for obsolete queries
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
    return queryMP(this.buildUrl(), window.API_SECRET, this.buildParams(), this.buildOptions());
  }

  // expected args: results, query (optional)
  processResults(results) {
    return results;
  }
}

// special string value used to mark pieces of state as "loading"
// while queries to populate the state are in flight
BaseQuery.LOADING = `$IRB_QUERY_LOADING`;

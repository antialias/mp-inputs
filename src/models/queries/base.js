export default class BaseQuery {
  constructor() {
    this.query = null; // used to check for obsolete queries
  }

  build(state) {
    this.query = this.buildQuery(state);
    return this;
  }

  run(cachedResult) {
    const query = this.query;

    return new Promise(resolve => {
      if (this.valid) {
        if (cachedResult) {
          resolve(cachedResult);
        } else {
          this.executeQuery().done(rawResults => {
            if (query === this.query) { // ignore obsolete queries
              resolve(this.processResults(rawResults));
            }
          });
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
    return '';
  }

  executeQuery() {
    return window.MP.api.query(this.buildUrl(), this.buildParams(), this.buildOptions());
  }

  // expected args: results, query (optional)
  processResults(results) {
    return results;
  }
}

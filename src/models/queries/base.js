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
          this.executeQuery()
            .then(rawResults => {
              if (query === this.query) { // ignore obsolete queries
                resolve(this.processResults(rawResults));
              }
            })
            .catch(err => console.error(err));
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

  MPApiQuery() {
    return window.MP.api.query(this.buildUrl(), this.buildParams(), this.buildOptions());
  }

  executeQuery() {
    return new Promise((resolve, reject) => {
      this.MPApiQuery()
        .done(results => resolve(results))
        .fail((xhr, status, error) => reject(error));
    });
  }

  // expected args: results, query (optional)
  processResults(results) {
    return results;
  }
}

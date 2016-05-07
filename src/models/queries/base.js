export default class BaseQuery {
  constructor() {
    this.query = null; // used to check for obsolete queries
  }

  build(state) {
    this.query = this.buildQuery(state);
    return this;
  }

  run() {
    const query = this.query;

    return new Promise(resolve => {
      if (this.valid) {
        this.executeQuery().done(rawResults => {
          if (query === this.query) { // ignore obsolete queries
            resolve(this.processResults(rawResults));
          }
        });
      } else {
        resolve(this.processResults(null));
      }
    });
  }

  get valid() {
    return true;
  }

  buildQuery() {
    return {};
  }

  buildUrl() {
    return '';
  }

  buildParams() {
    return {};
  }

  executeQuery() {
    return window.MP.api.query(this.buildUrl(), this.buildParams());
  }

  // expected args: results, query (optional)
  processResults(results) {
    return results;
  }
}

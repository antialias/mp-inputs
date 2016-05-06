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
      this.executeQuery(query).done(rawResults => {
        if (query === this.query) { // ignore obsolete queries
          resolve(this.processResults(rawResults, query));
        }
      });
    });
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

  executeQuery(query) {
    return window.MP.api.query(this.buildUrl(query), this.buildParams(query));
  }

  processResults(results, query) {
    return results;
  }
}

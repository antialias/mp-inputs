export default class BaseQuery {
  constructor() {
    this.currentQuery = null; // used to check for obsolete queries
  }

  build(state) {
    this.currentQuery = this.buildQuery(state);
    return this.currentQuery;
  }

  run(state) {
    const query = state ? this.build(state) : this.currentQuery;

    return new Promise((resolve, reject) => {
      this.executeQuery(query).done(rawResults => {
        if (query === this.currentQuery) { // ignore obsolete queries
          resolve(this.processResults(rawResults));
        }
      });
    });
  }

  buildQuery(state) {
    return {};
  }

  buildUrl(query) {
    return '';
  }

  buildParams(query) {
    return {};
  }

  executeQuery(query) {
    return window.MP.api.query(this.buildUrl(query), this.buildParams(query));
  }

  processResults(results) {
    return results;
  }
}

class QueryCache {
  constructor() {
    this.results = {};
  }

  get(query) {
    return this.results[this.hash(query)];
  }

  set(query, results) {
    this.results[this.hash(query)] = results;
  }

  hash(query) {
    let params = Object.keys(query);
    params.sort();
    return params.map(param => param + ':' + JSON.stringify(query[param])).join(',');
  }
}

export default class BaseQuery {
  constructor() {
    this.cache = new QueryCache();
    this.currentQuery = null; // used to check for obsolete queries
  }

  run(state) {
    return new Promise((resolve, reject) => {
      let query = this.buildQuery(state);
      let results = this.cache.get(query);

      this.currentQuery = query;

      if (results) {
        resolve(results);
      } else {
        this.executeQuery(query).done(rawResults => {
          let results = this.processResults(rawResults);

          this.cache.set(query, results);

          // ignore obsolete queries
          if (query === this.currentQuery) {
            resolve(results);
          }
        });
      }
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

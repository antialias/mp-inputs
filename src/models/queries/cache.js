export default class QueryCache {
  constructor() {
    this.results = {};
    this.expiries = {};
  }

  get(query) {
    const key = this.hash(query);
    const expires = this.expiries[key];

    if (expires && Date.now() >= expires) {
      return null;
    }

    return this.results[key];
  }

  set(query, results, expireSeconds) {
    const key = this.hash(query);

    this.results[key] = results;
    this.expiries[key] = expireSeconds ? Date.now() + expireSeconds * 1000 : null;
  }

  hash(query) {
    let params = Object.keys(query);
    params.sort();
    return params.map(param => param + ':' + JSON.stringify(query[param])).join(',');
  }
}

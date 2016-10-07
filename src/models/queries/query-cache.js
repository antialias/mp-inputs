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
    const params = Object.keys(query).sort();
    return params.map(param => {
      let value = query[param];
      if (query[param] instanceof Date) {
        value = query[param].toISOString().split(`:`).slice(0, -1).join(`:`);
      }
      return param + `:` + JSON.stringify(value);
    }).join(`,`);
  }
}

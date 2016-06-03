// safe namespaced in-browser persistence (currently localStorage only)

export default class Persistence {
  constructor(namespace) {
    this.namespace = namespace;
  }

  get(key) {
    try {
      return window.localStorage.getItem(this.keyFor(key));
    } catch (err) {
      return null;
    }
  }

  keyFor(key) {
    return `${this.namespace}:${key}`;
  }

  set(key, val) {
    try {
      window.localStorage.setItem(this.keyFor(key), val);
    } catch (err) {
      return;
    }
  }
}

import * as util from '../util';

function deepMapViews(views, func) {
  if (Array.isArray(views)) {
    return views.map(view => deepMapViews(view, func));
  } else if (typeof views === 'object' && typeof views.render !== 'function') {
    return Object.keys(views).reduce((renderers, key) => {
      return Object.assign({}, renderers, {
        [key]: deepMapViews(views[key], func),
      });
    }, {});
  } else {
    return func(views);
  }
}

export default class BaseView {
  constructor(parent, initialState={}) {
    this.parent = parent;
    this.initialState = initialState;
    this._template = this.TEMPLATE;
    this._views = this.VIEWS;
    this._viewRenderers = deepMapViews(this._views, view => view.render.bind(view));
  }

  render(state={}) {
    return this._template({
      state,
      util,
      elementClass: this.elementClass,
      constants: this.templateConstants,
      handlers: this.templateHandlers,
      helpers: this.templateHelpers,
      views: this._viewRenderers,
    });
  }
  get TEMPLATE() {
    throw'TEMPLATE must be provided by subclass';
  }

  get VIEWS(){
    return {};
  }

  get templateHandlers(){
    return {};
  }

  get templateHelpers(){
    return {};
  }

  get templateConstants() {
    return {};
  }

  setApp(app) {
    this.app = app;
    Object.assign(app.state, this.initialState);
    deepMapViews(this._views, view => view.setApp(app));
  }

  get elementClass() {
    return this.constructor.name.split(/(?=[A-Z][a-z])/)
      .map(word => word.toLowerCase())
      .join('-');
  }
}

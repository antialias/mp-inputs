import { View } from 'panel';

export default class BaseView extends View {
  render(state={}, props={}) {
    return this._template({
      handlers: this.templateHandlers,
      helpers: this.templateHelpers,
      constants: this.templateConstants,
      state,
      props,
      views: this._viewRenderers,
    });
  }

  get templateConstants() {
    return {};
  }
}

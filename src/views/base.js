import { View } from 'panel';

export default class BaseView extends View {
  render(state={}, props={}) {
    return this._template({
      state,
      props,
      className: this.className,
      handlers: this.templateHandlers,
      helpers: this.templateHelpers,
      constants: this.templateConstants,
      views: this._viewRenderers,
    });
  }

  get templateConstants() {
    return {};
  }

  get className() {
    return this.constructor.name.split(/(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('-');
  }
}

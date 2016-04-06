import { View } from 'panel';
import * as util from '../util';

export default class BaseView extends View {
  render(state={}) {
    return this._template({
      state,
      util,
      className: this.className,
      constants: this.templateConstants,
      handlers: this.templateHandlers,
      helpers: this.templateHelpers,
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

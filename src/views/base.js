import { View } from 'panel';
import * as util from '../util';

export default class BaseView extends View {
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

  get templateConstants() {
    return {};
  }

  get elementClass() {
    return this.constructor.name.split(/(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('-');
  }
}

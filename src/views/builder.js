import { View } from 'panel';

import template from '../templates/builder.jade';
import '../stylesheets/builder.styl';

export default class BuilderView extends View {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
    };
  }

  get templateHandlers() {
    return {
    };
  }
}

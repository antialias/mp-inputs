import { View } from 'panel';

import template from '../templates/builder/filter.jade';
import '../stylesheets/builder/filter.styl';

export default class FilterView extends View {
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

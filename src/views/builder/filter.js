import BaseView from '../base';

import template from '../templates/builder/filter.jade';
import '../stylesheets/builder/filter.styl';

export default class FilterView extends BaseView {
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

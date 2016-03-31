import BaseView from './base';

import template from './templates/result.jade';
import './stylesheets/result.styl';

export default class ResultView extends BaseView {
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

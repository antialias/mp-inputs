import BaseView from '../base';

import template from '../templates/builder/control.jade';
import '../stylesheets/builder/control.styl';

export default class ControlView extends BaseView {
  get TEMPLATE() {
    return template;
  }
}

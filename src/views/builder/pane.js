import BaseView from '../base';

import template from '../templates/builder/pane.jade';
import '../stylesheets/builder/pane.styl';

export default class PaneView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get templateConstants() {
    return {
      search: true,
    };
  }
}

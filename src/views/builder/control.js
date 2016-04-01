import BaseView from '../base';

import template from '../templates/builder/control.jade';
import '../stylesheets/builder/control.styl';

export default class ControlView extends BaseView {
  setApp() {
    super.setApp(...arguments);
    this.app.onClickOutside(this.className, () => this.app.stopEditingClause());
  }

  get TEMPLATE() {
    return template;
  }
}

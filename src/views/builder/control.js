import BaseView from '../base';

import template from '../templates/builder/control.jade';
import '../stylesheets/builder/control.styl';

export default class ControlView extends BaseView {
  setApp() {
    super.setApp(...arguments);
    this.app.onClickOutside(this.className, 'stopEditingClause');
  }

  get TEMPLATE() {
    return template;
  }

  get templateHelpers() {
    return {
      getLabelParts: props => {
        let label = this.templateConstants.label || this.templateHelpers.getLabel(props);
        return typeof label === 'string' ? [label] : label;
      }
    }
  }
}

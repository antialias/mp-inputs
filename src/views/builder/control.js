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

  get templateConstants() {
    return {
      paneWidth: 400,
    };
  }

  get templateHelpers() {
    return {
      getLabelParts: props => {
        let label = this.templateConstants.label || this.templateHelpers.getLabel(props);
        return typeof label === 'string' ? [label] : label;
      },
      updatePosition: event => this.position = event.target.parentNode.getBoundingClientRect(),
      getPaneLeft: () => !this.position ? 0 : Math.min(0, (window.innerWidth - this.position.left) - this.templateConstants.paneWidth),
    };
  }
}

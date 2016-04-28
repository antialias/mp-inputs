import BaseView from '../base';
import { extend } from '../../util';

import template from '../templates/builder/control.jade';
import '../stylesheets/builder/control.styl';

class ControlView extends BaseView {
  setApp() {
    super.setApp(...arguments);
    this.app.onClickOutside(this.elementClass, 'stopEditingClause');
  }

  get TEMPLATE() {
    return template;
  }

  get templateConstants() {
    return {
      paneWidth: 400,
      paneHeight: 340,
    };
  }

  get templateHelpers() {
    return {
      updatePosition: event => this.position = event.target.parentNode.getBoundingClientRect(),
      getPaneLeft: () => !this.position ? 0 : Math.min(0, (window.innerWidth - this.position.left) - this.templateConstants.paneWidth),
    };
  }
}

export class AddControlView extends ControlView {
  get templateConstants() {
    return extend(super.templateConstants, {
      showRemove: false,
      class: 'verb',
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      isPaneOpen: () => this.app.isAddingClause(this.section),
      openPane: () => this.app.startAddingClause(this.section),
    });
  }
}

export class EditControlView extends ControlView {
  get templateConstants() {
    return extend(super.templateConstants, {
      class: 'noun',
      showRemove: true,
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      removeClause: clauseIndex => this.app.removeClause(this.section, clauseIndex),
      isPaneOpen: clauseIndex => this.app.isEditingClause(this.section, clauseIndex),
      openPane: clauseIndex => this.app.startEditingClause(this.section, clauseIndex),
    });
  }
}

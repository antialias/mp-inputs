import { Component } from 'panel';

import { extend } from '../../../util';

import template from './index.jade';
import './index.styl';

class ControlComponent extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    // this.app.onClickOutside(this.elementClass, 'stopEditingClause');
  }

  get config() {
    return {
      template,

      helpers: {
        updatePosition: ev => this.position = ev.target.parentNode.getBoundingClientRect(),
        getPaneLeft: () => !this.position ? 0 : Math.min(0, (window.innerWidth - this.position.left) - this.constants.paneWidth),
      },
    };
  }

  get constants() {
    return {
      paneWidth: 400,
      paneHeight: 340,
    };
  }

  get section() {
    throw 'Not implemented!';
  }
}

export class AddControl extends ControlComponent {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        isPaneOpen: () => this.app.isAddingClause(this.section),
        openPane: () => this.app.startAddingClause(this.section),
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      class: 'verb',
      showRemove: false,
    });
  }
}

export class EditControl extends ControlComponent {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        removeClause: clauseIndex => this.app.removeClause(this.section, clauseIndex),
        isPaneOpen: clauseIndex => this.app.isEditingClause(this.section, clauseIndex),
        openPane: clauseIndex => this.app.startEditingClause(this.section, clauseIndex),
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      class: 'noun',
      showRemove: true,
    });
  }
}

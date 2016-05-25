import { Component } from 'panel';

import { extend } from '../../../util';

import './date-picker';

import template from './index.jade';
import './index.styl';

class ControlComponent extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, 'stopEditingClause');
  }

  get config() {
    return {
      template,
      helpers: {
        getClass: () => this.elementClass,
        getLabel: () => this.label,
        isRemoveable: () => this.isRemoveable,
        clickModify: ev => {
          this.updatePosition(ev);
          this.openPane();
        },
        getPaneLeft: () => !this.position ? 0 : Math.min(0, (window.innerWidth - this.position.left) - this.constants.paneWidth),
        updatePosition: ev => this.updatePosition(ev),
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

  get elementClass() {
    throw 'Not implemented!';
  }

  get label() {
    throw 'Not implemented!';
  }

  get isRemoveable() {
    throw 'Not implemented!';
  }

  openPane() {
    throw 'Not implemented!';
  }

  updatePosition(ev) {
    this.position = ev.target.parentNode.getBoundingClientRect();
  }
}

export class AddControl extends ControlComponent {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        isPaneOpen: () => this.app.isAddingClause(this.section),
      }),
    });
  }

  get elementClass() {
    return 'verb';
  }

  get isRemoveable() {
    return false;
  }

  openPane() {
    this.app.startAddingClause(this.section);
  }
}

export class EditControl extends ControlComponent {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        removeClause: () => this.app.removeClause(this.section, this.clauseIndex),
        isPaneOpen: () => this.app.isEditingClause(this.section, this.clauseIndex),
      }),
    });
  }

  get elementClass() {
    return 'noun';
  }

  get isRemoveable() {
    return true;
  }

  get clauseIndex() {
    return Number(this.getAttribute('clause-index'));
  }

  openPane() {
    this.app.startEditingClause(this.section, this.clauseIndex);
  }
}

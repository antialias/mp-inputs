import { Component } from 'panel';

import { extend } from '../../../util';

import { GroupClause, ShowClause } from '../../../models/clause';

import addTemplate from './add-control.jade';
import editTemplate from './edit-control.jade';
import './index.styl';

export class EditControl extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, `stopBuildingQuery`);
  }

  get config() {
    return {
      helpers: extend(super.config.helpers, {
        clickedLabel: () => {
          this.openPane();
          this.app.stopEditingClause();
          this.app.startEditingClause(this.section, this.clauseIndex);
        },
        getLabel: () => this.getLabel(),
        isPaneOpen: () => !!this.state.builderPane.screens.length && this.app.isEditingClause(this.section, this.clauseIndex),
        isRemovable: () => this.isRemovable(),
        removeClause: () => this.app.removeClause(this.section, this.clauseIndex),
      }),
      template: editTemplate,
    };
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }

  clickedLabel() {
    throw `Not implemented!`;
  }

  shouldUpdate(state) {
    return !!state.report.sections.getClause(this.section, this.clauseIndex);
  }

  isRemovable() {
    throw `Not implemented!`;
  }

  getLabel() {
    throw `Not implemented!`;
  }
}

export class AddControl extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, `stopBuildingQuery`);
  }

  get config() {
    return {
      helpers: extend(super.config.helpers, {
        clickedAdd: () => {
          if (!this.isPaneOpen()) {
            this.openPane();
          }
          this.app.updateBuilder({isContextualMenuOpen: !this.isPaneOpen()});
        },
        isPaneOpen: () => this.isPaneOpen(),
        getElementClasses: () => this.elementClasses,
        getPreposition: () => ({
          [ShowClause.TYPE]: `and`,
          [GroupClause.TYPE]: `by`,
        }[this.app.originStageClauseType()] || ``),
      }),
      template: addTemplate,
    };
  }

  get controlType() {
    return `add`;
  }

  get elementClasses() {
    return [];
  }

  isPaneOpen() {
    throw `Not implemented!`;
  }

  openPane() {
    throw `Not implemented!`;
  }
}

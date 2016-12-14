import { Component } from 'panel';

import { extend } from '../../../util';

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
        getLabel: () => this.label,
        isPaneOpen: () => !!this.state.builderPane.screens.length && this.app.isEditingClause(this.section, this.clauseIndex),
        isRemovable: () => this.isRemovable(),
        removeClause: () => this.app.removeClause(this.section, this.clauseIndex),
      }),
      template: editTemplate,
    };
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

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }

  get label() {
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
        clickAdd: () => {
          if (!this.isPaneOpen()) {
            this.clickAdd();
          }
          this.app.updateBuilder({isContextualMenuOpen: !this.isPaneOpen()});
        },
        isPaneOpen: () => this.isPaneOpen(),
        getElementClasses: () => this.elementClasses,
        getPreposition: () => {
          let preposition;
          switch(this.app.originStageClauseType()) {
            case `show`:
              preposition = `and`;
          }
          return preposition;
        },
      }),
      template: addTemplate,
    };
  }

  clickAdd() {
    throw `Not implemented!`;
  }

  isPaneOpen() {
    throw `Not implemented!`;
  }

  get controlType() {
    return `add`;
  }

  get elementClasses() {
    return [];
  }
}

import { Component } from 'panel';

import template from './index.jade';
import './index.styl';

class ControlComponent extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, `stopBuildingQuery`);
  }

  get config() {
    return {
      template,
      helpers: {
        clickLabel: () => this.clickLabel && this.clickLabel(),
        clickModify: () => this.clickModify(),
        removeClause: () => this.app.removeClause(this.section, this.clauseIndex),
      },
    };
  }

  get elementClasses() {
    return [`${this.controlType}-control`];
  }

  get isRemoveable() {
    return true;
  }

  get label() {
    return null;
  }

  remove() {
    this.app.removeClause(this.section, this.clauseIndex);
  }

  isPaneOpen() {
    throw `Not implemented!`;
  }

  clickModify() {
    throw `Not implemented!`;
  }
}

export class AddControl extends ControlComponent {
  get elementClass() {
    return `verb`;
  }

  get isRemoveable() {
    return false;
  }

  isPaneOpen() {
    return !!this.state.builderPane.screens.length &&
      this.app.isAddingClause(this.section);
  }

  openPane() {
    this.app.stopEditingClause();
    this.app.startAddingClause(this.section);
  }
}

export class EditControl extends ControlComponent {
  shouldUpdate(state) {
    return !!state.report.sections.getClause(this.section, this.clauseIndex);
  }

  get controlType() {
    return `edit`;
  }

  isPaneOpen() {
    return !!this.state.builderPane.screens.length && this.app.isEditingClause(this.section, this.clauseIndex);
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }

  clickLabel() {
    this.app.startBuilderOnScreen(`builder-screen-sources`);
    this.app.stopEditingClause();
    this.app.startEditingClause(this.section, this.clauseIndex);
  }
}

export class AddControl extends ControlComponent {
  get controlType() {
    return `add`;
  }

  get isRemoveable() {
    return false;
  }
}

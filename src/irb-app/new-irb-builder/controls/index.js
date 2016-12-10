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
        clickModify: ev => {
          this.updatePosition(ev);
          this.openPane();
        },
        getPaneLeft: () => !this.position ? 0 : Math.min(0, (window.innerWidth - this.position.left) - this.constants.paneWidth),
        removeClause: () => this.remove(),
        updatePosition: ev => this.updatePosition(ev),
      },
    };
  }

  get section() {
    throw `Not implemented!`;
  }

  get elementClass() {
    throw `Not implemented!`;
  }

  get label() {
    throw `Not implemented!`;
  }

  get isRemoveable() {
    throw `Not implemented!`;
  }

  remove() {
    this.app.removeClause(this.section, this.clauseIndex);
  }

  isPaneOpen() {
    throw `Not implemented!`;
  }

  openPane() {
    throw `Not implemented!`;
  }

  updatePosition(ev) {
    this.position = ev.target.parentNode.getBoundingClientRect();
  }
}

export class EditControl extends ControlComponent {
  shouldUpdate(state) {
    return !!state.report.sections.getClause(this.section, this.clauseIndex);
  }

  get elementClass() {
    return `noun`;
  }

  get isRemoveable() {
    return true;
  }

  isPaneOpen() {
    return !!this.state.builderPane.screens.length && this.clauseIndex === this.state.stageClauseIndex;
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-sources`);
    this.app.stopEditingClause();
    this.app.startEditingClause(this.section, this.clauseIndex);
  }
}

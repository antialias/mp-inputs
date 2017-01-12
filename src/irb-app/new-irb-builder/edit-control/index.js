import { Component } from 'panel';

import { extend } from '../../../util';

import template from './index.jade';
import './index.styl';

export class EditControl extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, `stopBuildingQuery`);
  }

  get config() {
    return {
      helpers: extend(super.config.helpers, {
        clickedInput: ev => ev.stopPropagation(), // don't close menu!
        clickedLabel: () => {
          this.openPane();
          this.app.stopEditingClause();
          this.app.startEditingClause(this.section, this.clauseIndex);
          requestAnimationFrame(() => this.el.querySelector(`input.control-label`).focus());
        },
        menuChange: ev => ev.detail && ev.detail.state === `closed` && this.app.stopBuildingQuery(),
        searchHandler: ev => this.update({contextFilter: ev.target.value}),

        getLabel: () => this.getLabel(),
        isPaneOpen: () => this.isPaneOpen(),
        isRemovable: () => this.isRemovable(),
        removeClause: () => this.remove(),
      }),
      template,
    };
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }

  getLabel() {
    throw new Error(`Not implemented!`);
  }

  get section() {
    throw new Error(`Not implemented!`);
  }

  get elementClass() {
    throw new Error(`Not implemented!`);
  }

  get label() {
    throw new Error(`Not implemented!`);
  }

  get isRemoveable() {
    throw new Error(`Not implemented!`);
  }

  isPaneOpen() {
    return !!this.state.builderPane.screens.length
      && this.app.isEditingClause(this.section, this.clauseIndex)
      && this.state.activeMathMenuIndex === null;
  }

  isRemovable() {
    return true;
  }

  openPane() {
    throw new Error(`Not implemented!`);
  }

  shouldUpdate(state) {
    return !!state.report.sections.getClause(this.section, this.clauseIndex);
  }

  remove() {
    this.app.removeClause(this.section, this.clauseIndex);
  }
}

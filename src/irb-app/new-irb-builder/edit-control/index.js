import { Component } from 'panel';
import throttle from 'lodash/throttle';

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
        },
        labelPrefixComponent: () => this.labelPrefixComponent(),
        menuChange: ev => ev.detail && ev.detail.state === `closed` && this.isPaneOpen() && this.app.stopBuildingQuery(),
        changedSearch: throttle(ev => {
          this.update({contextFilter: ev.target.value});
          this.app.updateBuilderCurrentScreen({progressiveListSize: null});
        }, 200, {leading: true, maxWait: 200}),
        getLabel: () => this.getLabel(),
        getLabelText: () => {
          const label = this.getLabel();
          return Array.isArray(label) ? label[0] : label;
        },
        insertedInput: vnode => vnode.elm.focus(),
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

  get elementClass() {
    throw new Error(`Not implemented!`);
  }

  get isRemoveable() {
    throw new Error(`Not implemented!`);
  }

  get label() {
    throw new Error(`Not implemented!`);
  }

  get section() {
    throw new Error(`Not implemented!`);
  }

  getLabel() {
    throw new Error(`Not implemented!`);
  }

  getClause(state) {
    return (state || this.state).report.sections.getClause(this.section, this.clauseIndex);
  }

  isPaneOpen() {
    return !!this.state.builderPane.screens.length
      && this.app.isEditingClause(this.section, this.clauseIndex)
      && this.state.activeMathMenuIndex === null;
  }

  isRemovable() {
    return true;
  }

  labelPrefixComponent() {
    return {
      componentName: false,
      attrs: false,
    };
  }

  openPane() {
    throw new Error(`Not implemented!`);
  }

  remove() {
    this.app.removeClause(this.section, this.clauseIndex);
  }

  shouldUpdate(state) {
    return !!this.getClause(state);
  }
}

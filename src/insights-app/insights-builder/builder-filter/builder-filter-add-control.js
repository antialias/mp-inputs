import { Component } from 'panel';

import { FilterClause } from '../../../models/clause';

import template from './builder-filter-add-control.jade';

document.registerElement(`builder-filter-add-control`, class extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, `stopBuildingQuery`);
  }

  get config() {
    return {
      template,
      helpers: {
        clickedAdd: () => {
          if (!this.app.canAddFilterClause()) {
            this.app.openUpsellModal(`filterClause`);
            this.app.stopBuildingQuery(this.tagName);
            return;
          }
          if (!this.isPaneOpen()) {
            this.openPane();
            this.app.updateBuilder({searchFocused: true});
          } else {
            this.app.stopBuildingQuery(this.tagName);
          }
        },
        clickedInput: ev => ev.stopPropagation(), // don't close menu!
        handleKeydown: ev => this.app.handleKeydown(ev),
        insertedInput: vnode => vnode.elm.focus(),
        isPaneOpen: () => this.isPaneOpen(),
        changedSearch: ev => this.update({contextFilter: ev.target.value}),
        blurredSearch: () => this.app.updateBuilder({searchFocused: false}),
        updateFocus: vnode => {
          if (this.state.builderPane.searchFocused) {
            vnode.elm.focus();
          }
        },
        shouldShowUpsellIcon: () => (!this.app.canAddFilterClause()),
        shouldShowUpsellModal: () => this.state.upsellModal === `filterClause`,
        closeUpsellModal: ev => this.app.maybeCloseUpsellModal(ev, `filterClause`),
      },
    };
  }

  isPaneOpen() {
    return !!this.state.builderPane.screens.length
      && this.app.isAddingClause(FilterClause.TYPE)
      && this.state.activeMathMenuIndex === null;
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-filter-properties-list`);
    this.app.startAddingClause(FilterClause.TYPE);
  }
});

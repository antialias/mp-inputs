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
      helpers: {
        clickedAdd: () => {
          if (!this.isPaneOpen()) {
            this.openPane();
          } else {
            this.app.stopBuildingQuery(this.tagName);
          }
        },
        isPaneOpen: () => this.isPaneOpen(),
      },
      template,
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

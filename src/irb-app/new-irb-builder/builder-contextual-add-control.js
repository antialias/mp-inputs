import { Component } from 'panel';

import { GroupClause, ShowClause } from '../../models/clause';

import template from './builder-contextual-add-control.jade';

document.registerElement(`query-builder-contextual-add`, class extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, `stopBuildingQuery`);
  }

  get config() {
    return {
      template,
      helpers: {
        clickedAdd: () => {
          if (!this.isPaneOpen()) {
            this.openPane();
          } else {
            this.app.stopBuildingQuery();
          }
        },
        getPreposition: () => ({
          [ShowClause.TYPE]: `and`,
          [GroupClause.TYPE]: `by`,
        }[this.app.originStageClauseType()] || ``),
        isPaneOpen: () => this.isPaneOpen(),
      },
    };
  }

  isPaneOpen() {
    return this.state.builderPane.screens.length && this.state.builderPane.isContextualMenuOpen;
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-contextual`);
    this.app.updateBuilder({isContextualMenuOpen: true});
  }
});
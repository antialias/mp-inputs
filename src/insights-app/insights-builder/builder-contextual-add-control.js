import { Component } from 'panel';
import throttle from 'lodash/throttle';

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
          if (!this.app.canAddBuilderClause()) {
            this.app.openUpsellModal(`builderClause`);
            this.app.stopBuildingQuery();
            return;
          }
          if (!this.isPaneOpen()) {
            this.openPane();
          } else {
            this.app.stopBuildingQuery();
          }
        },
        clickedInput: ev => ev.stopPropagation(), // don't close menu!
        handleKeydown: ev => this.app.handleKeydown(ev),
        menuChange: ev => ev.detail && ev.detail.state === `closed` && this.isPaneOpen() && this.app.stopBuildingQuery(),
        shouldShowUpsellIcon: () => (!this.app.canAddBuilderClause()),
        getPreposition: () => ({
          [ShowClause.TYPE]: `and`,
          [GroupClause.TYPE]: `by`,
        }[this.app.originStageClauseType()] || ``),
        insertedInput: vnode => vnode.elm.focus(),
        isPaneOpen: () => this.isPaneOpen(),
        changedSearch: throttle(ev => {
          this.update({contextFilter: ev.target.value});
          this.app.updateBuilder({activeIndex: 0});
          this.app.updateBuilderCurrentScreen({progressiveListSize: null});
        }, 200, {leading: true, maxWait: 200}),
        shouldShowUpsellModal: () => (this.state.upsellModal === `builderClause`),
        closeUpsellModal: ev => this.app.maybeCloseUpsellModal(ev, `filter-levels`),
      },
    };
  }

  isPaneOpen() {
    return this.state.builderPane.screens.length && this.state.builderPane.isContextualMenuOpen && this.state.stageClauseIndex === null;
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-contextual`);
    this.app.updateBuilder({isContextualMenuOpen: true});
  }
});

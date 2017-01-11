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
          if (!this.isPaneOpen()) {
            this.openPane();
            this.el.querySelector(`input.control-label`).focus();
          } else {
            this.app.stopBuildingQuery();
          }
        },
        clickedInput: ev => ev.stopPropagation(), // don't close menu!
        menuChange: ev => ev.detail && ev.detail.state === `closed` && this.app.stopBuildingQuery(),

        getPreposition: () => ({
          [ShowClause.TYPE]: `and`,
          [GroupClause.TYPE]: `by`,
        }[this.app.originStageClauseType()] || ``),
        isPaneOpen: () => this.isPaneOpen(),
        changedSearch: throttle(ev => {
          this.update({contextFilter: ev.target.value});
          this.app.updateBuilderCurrentScreen({progressiveListSize: null});
        }, 200, {leading: true, maxWait: 200}),
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

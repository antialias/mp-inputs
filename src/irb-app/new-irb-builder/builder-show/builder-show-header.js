import { Component } from 'panel';

import { ShowClause } from '../../../models/clause';

import template from './builder-show-header.jade';

document.registerElement(`query-builder-show-header`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        isStaticHeader: () => {
          // Static Header for "All People" with no numeric properties
          const associatedClause = this.getAssociatedClause();
          return associatedClause.resourceType === ShowClause.RESOURCE_TYPE_PEOPLE
            && !associatedClause.property;
        },
        getCurrentMathChoice: () => {
          const associatedClause = this.getAssociatedClause();
          return associatedClause && associatedClause.math;
        },
        headerClicked: ev => {
          if (this.isPaneOpen()) {
            this.app.stopEditingClause();
          } else {
            ev.stopPropagation();
            const activeMathMenuIndex = this.clauseIndex;
            this.app.startBuilderOnScreen(`builder-screen-event-operator`);
            this.app.update({activeMathMenuIndex});
            this.app.startEditingClause(ShowClause.TYPE, activeMathMenuIndex);
          }
        },
        isOpen: () => this.isPaneOpen(),
      },
    };
  }

  getAssociatedClause() {
    return this.state.report.sections.getClause(ShowClause.TYPE, this.clauseIndex);
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }

  isPaneOpen() {
    return this.state.activeMathMenuIndex === this.clauseIndex;
  }
});

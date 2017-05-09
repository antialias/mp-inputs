import {Component} from 'panel';

import {ShowClause} from '../../../models/clause';

import template from './builder-show-header.jade';

document.registerElement(`query-builder-show-header`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        hasNumericProperty: () => {
          const clause = this.getAssociatedClause();
          return clause && !!clause.property;
        },
        buttonPositionStyle: () => {
          const showClauseWidths = this.state.showClauseWidths;
          const relevantWidths = showClauseWidths[this.clauseIndex] || {};
          const clauseOffset = (relevantWidths.numericPropertyWidth || relevantWidths.clauseWidth || 0);
          return Math.max(clauseOffset, relevantWidths.headerWidth) + `px`;
        },
        isStaticHeader: () => {
          // Static Header for "All People" with no numeric properties
          const associatedClause = this.getAssociatedClause();
          return associatedClause && associatedClause.resourceType === ShowClause.RESOURCE_TYPE_PEOPLE
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
        isRemovable: () => this.app.getClausesForType(`show`).length > 1,
        removeClause: ev => {
          ev.stopPropagation();
          this.app.removeClause(`show`, this.clauseIndex);
        },
        removeProperty: ev => {
          ev.stopPropagation();
          this.app.updateClause(`show`, this.clauseIndex, {property: null});
        },
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

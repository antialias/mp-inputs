import { Component } from 'panel';

import { ShowClause } from '../../../../models/clause';

import template from './index.jade';
import './index.styl';

document.registerElement(`query-builder-show-header`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        getCurrentMathChoice: () => {
          const associatedClause = this.state.report.sections.getClause(ShowClause.TYPE, this.clauseIndex);
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

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }

  isPaneOpen() {
    return this.state.activeMathMenuIndex === this.clauseIndex;
  }
});

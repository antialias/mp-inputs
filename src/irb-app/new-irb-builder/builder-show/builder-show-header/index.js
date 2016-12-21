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
          ev.stopPropagation();
          const activeMathMenuIndex = this.clauseIndex;
          this.app.startBuilderOnScreen(`builder-screen-event-operator`);
          this.app.update({activeMathMenuIndex});
          this.app.startEditingClause(ShowClause.TYPE, activeMathMenuIndex);
        },
        isOpen: () => this.state.activeMathMenuIndex === this.clauseIndex,
      },
    };
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }
});

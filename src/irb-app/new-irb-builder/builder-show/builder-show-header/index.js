import { Component } from 'panel';

import { ShowClause } from '../../../../models/clause';

import template from './index.jade';
import './index.styl';

document.registerElement(`query-builder-show-header`, class extends Component {
  get config() {
    return {
      helpers: {
        getCurrentMathChoice: () => {
          return this.state.report.sections.show.clauses[this.clauseIndex].math;
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
      template,
    };
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }
});

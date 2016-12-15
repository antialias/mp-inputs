import { Component } from 'panel';

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
          var currentIdx = this.clauseIndex;
          this.app.update({activeMathMenuIndex: currentIdx});
          this.app.startBuilderOnScreen(`builder-screen-math`);
          this.app.startEditingClause(`show`, currentIdx);
        },
      },
      template,
    };
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }
});

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
          //start editing this
          ev.stopPropagation();
          this.app.startBuilderOnScreen('builder-screen-math');
          this.app.startEditingClause('show', this.clauseIndex);
          //open pane on math screen

        },
      },
      template,
    };
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }
});

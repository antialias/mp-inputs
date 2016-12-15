import { Component } from 'panel';

import template from './index.jade';
import './index.styl';

document.registerElement(`query-builder-show-header`, class extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
  }

  get config() {
    return {
      helpers: {
        getCurrentMathChoice: () => {
          return this.state.report.sections.show.clauses[this.clauseIndex].math;
        },
        headerClicked: () => {
          alert('click!');
        },
      },
      template,
    };
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }
});

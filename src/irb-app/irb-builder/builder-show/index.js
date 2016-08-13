import { Component } from 'panel';

import { capitalize, renameEvent } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { BuilderPane } from '../builder-pane';

import template from './index.jade';
import './index.styl';

document.registerElement('builder-show', class extends Component {
  get config() {
    return {template};
  }
});

// controls
document.registerElement('show-add-control', class extends AddControl {
  get section() {
    return 'show';
  }

  get label() {
    return 'Compare';
  }
});

document.registerElement('show-edit-control', class extends EditControl {
  get section() {
    return 'show';
  }

  get label() {
    const clause = this.state.report.sections.getClause('show', this.clauseIndex);
    const math = capitalize(clause.math);
    return [math, ' number of ', renameEvent(clause.value.name)];
  }

  get isRemoveable() {
    return this.state.report.sections.show.clauses.length > 1;
  }
});

// dropdown content
document.registerElement('show-pane', class extends BuilderPane {
  get section() {
    return 'show';
  }

  get subpanes() {
    const stagedClause = this.state.stageClauses[0];
    const propStaged = stagedClause && typeof stagedClause.value === 'string';
    return [this.showPaneContent].concat(propStaged ? this.eventPaneContent : [
      this.groupPropertyPaneContent,
      this.filterPropertyValuePaneContent,
    ]);
  }
});

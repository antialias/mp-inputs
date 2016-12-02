import { Component } from 'panel';

import { renameEvent } from '../../../util';

import { EditControl } from '../controls';

import template from './index.jade';
import './index.styl';

document.registerElement(`query-builder-show`, class extends Component {
  get config() {
    return {template};
  }
});

document.registerElement(`builder-show-edit-control`, class extends EditControl {
  get section() {
    return `show`;
  }

  get label() {
    const clause = this.state.report.sections.getClause(`show`, this.clauseIndex);
    return renameEvent(clause.value.name);
  }

  get isRemoveable() {
    return this.state.report.sections.show.clauses.length > 1;
  }
});

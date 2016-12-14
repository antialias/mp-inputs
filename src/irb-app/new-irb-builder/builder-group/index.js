// "Group by" controls for segmenting

import { Component } from 'panel';

import { renameProperty } from '../../../util';

import { EditControl } from '../controls';

import template from './index.jade';

document.registerElement(`query-builder-group`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        moveClause: (clauseIndex, offset) => this.app.moveClause(`group`, clauseIndex, offset),
      },
    };
  }
});

document.registerElement(`builder-group-edit-control`, class extends EditControl {
  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-group-properties`);
  }

  isRemovable() {
    return true;
  }

  get section() {
    return `group`;
  }

  get label() {
    const clause = this.state.report.sections.getClause(`group`, this.clauseIndex);
    return clause && clause.value && renameProperty(clause.value);
  }
});

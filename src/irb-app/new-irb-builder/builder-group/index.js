// "Group by" controls for segmenting

import { Component } from 'panel';

import { renameProperty } from '../../../util';

import { AddControl, EditControl } from '../controls';

import template from './index.jade';
import './index.styl';

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

// controls
document.registerElement(`builder-group-add-control`, class extends AddControl {
  get section() {
    return `group`;
  }

  get label() {
    return ``;
  }

  openPane() {
    super.openPane();
    this.app.startBuilderOnScreen(`builder-screen-group-properties`);
  }
});

document.registerElement(`builder-group-edit-control`, class extends EditControl {
  get section() {
    return `group`;
  }

  get label() {
    const clause = this.state.report.sections.getClause(`group`, this.clauseIndex);
    return clause && clause.value && renameProperty(clause.value);
  }

  openPane() {
    super.openPane();
    this.app.startBuilderOnScreen(`builder-screen-group-properties`);
  }
});

import { Component } from 'panel';

import { renameProperty } from '../../../util';

import { EditControl } from '../edit-control';
import { GroupClause } from '../../../models/clause';

import './builder-screen-group-properties';

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
  get section() {
    return GroupClause.TYPE;
  }

  getLabel() {
    const clause = this.state.report.sections.getClause(`group`, this.clauseIndex);
    return clause && clause.value && renameProperty(clause.value);
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-group-properties`);
  }
});

import { Component } from 'panel';
import { formatDateDisplay } from '../../../util';

import { EditControl } from '../edit-control';
import { TimeClause } from '../../../models/clause';

import './builder-screen-time';
import './builder-screen-time-custom';

import template from './index.jade';

document.registerElement(`query-builder-time`, class extends Component {
  get config() {
    return {template};
  }
});

document.registerElement(`builder-time-edit-control`, class extends EditControl {
  get section() {
    return TimeClause.TYPE;
  }

  getLabel() {
    const clause = this.state.report.sections.time.clauses[0];
    return clause.range ? clause.range : `${formatDateDisplay(clause.value[0])} - ${formatDateDisplay(clause.value[1])}`;
  }

  getSelectionAttrs() {
    return {
      source: `time`,
      selected: this.getLabel(),
    };
  }

  isRemovable() {
    return false;
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-time`);
  }
});

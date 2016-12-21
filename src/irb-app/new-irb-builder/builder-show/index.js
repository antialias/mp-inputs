import { Component } from 'panel';

import {
  renameEvent,
  renameProperty,
} from '../../../util';

import { EditControl } from '../edit-control';
import { ShowClause } from '../../../models/clause';

import './builder-screen-event-operator';
import './builder-screen-events';
import './builder-screen-numeric-properties';
import './builder-show-header';

import template from './index.jade';

document.registerElement(`query-builder-show`, class extends Component {
  get config() {
    return {template};
  }
});

document.registerElement(`builder-show-edit-control`, class extends EditControl {
  get section() {
    return ShowClause.TYPE;
  }

  getLabel() {
    const clause = this.state.report.sections.getClause(this.section, this.clauseIndex);
    return renameEvent(clause.value.name);
  }

  isPaneOpen() {
    return super.isPaneOpen() && !this.state.isEditingNumericProperty;
  }

  isRemovable() {
    return this.app.getClausesForType(this.section).length > 1;
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-events`);
    this.app.update({isEditingNumericProperty: false});
  }
});

document.registerElement(`builder-numeric-property-edit-control`, class extends EditControl {
  get section() {
    return ShowClause.TYPE;
  }

  getLabel() {
    const clause = this.state.report.sections.getClause(this.section, this.clauseIndex);
    return clause && clause.property ? renameProperty(clause.property.name) : ``;
  }

  isPaneOpen() {
    return super.isPaneOpen() && this.state.isEditingNumericProperty;
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-numeric-properties`);
    this.app.update({isEditingNumericProperty: true});
  }

  remove() {
    this.app.updateClause(this.section, this.clauseIndex, {property: null});
  }
});

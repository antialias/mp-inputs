import { Component } from 'panel';

import {
  renameEvent,
  renameProperty,
} from '../../../util';

import { EditControl } from '../controls';

import template from './index.jade';

document.registerElement(`query-builder-show`, class extends Component {
  get config() {
    return {template};
  }
});

document.registerElement(`builder-show-edit-control`, class extends EditControl {
  isRemovable() {
    return this.state.report.sections.show.clauses.length > 1;
  }

  get label() {
    const clause = this.state.report.sections.getClause(this.section, this.clauseIndex);
    return renameEvent(clause.value.name);
  }

  get section() {
    return `show`;
  }

  isPaneOpen() {
    return super.isPaneOpen() && !this.state.isEditingNumericProperty;
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-events`);
    this.app.update({isEditingNumericProperty: false});
  }
});

document.registerElement(`builder-numeric-property-edit-control`, class extends EditControl {
  get section() {
    return `show`;
  }

  get label() {
    const clause = this.state.report.sections.getClause(`show`, this.clauseIndex);
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

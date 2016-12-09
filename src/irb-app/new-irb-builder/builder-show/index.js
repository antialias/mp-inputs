import { Component } from 'panel';

import {
  renameEvent,
  renameProperty,
} from '../../../util';

import { AddControl, EditControl } from '../controls';


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

  isPaneOpen() {
    return super.isPaneOpen() && !this.state.isEditingNumericProperty;
  }

  openPane() {
    super.openPane();
    this.app.startBuilderOnScreen(`builder-screen-sources`);
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
    super.openPane();
    this.app.startBuilderOnScreen(`builder-screen-numeric-properties`);
    this.app.update({isEditingNumericProperty: true});
  }

  remove() {
    this.app.updateClause(this.section, this.clauseIndex, {property: null});
  }
});


document.registerElement(`builder-contextual-menu`, class extends AddControl {
  get elementClasses() {
    return super.elementClasses.concat(`contextual-menu`);
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-sources`);
  }
});

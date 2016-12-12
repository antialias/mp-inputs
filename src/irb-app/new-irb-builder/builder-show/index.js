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

document.registerElement(`builder-add-contextual`, class extends AddControl {
  clickAdd() {
    if (!this.isPaneOpen()) {
      this.app.startBuilderOnScreen(`builder-screen-contextual`);
    }
    this.app.updateBuilder({isContextualMenuOpen: !this.isPaneOpen()});
  }

  isPaneOpen() {
    return this.state.builderPane.screens.length && this.state.builderPane.isContextualMenuOpen;
  }

  get elementClasses() {
    return [`contextual-menu`];
  }
});

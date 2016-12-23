import { Component } from 'panel';

import {
  renameEvent,
  renameProperty,
} from '../../../util';

import { EditControl } from '../edit-control';
import { ShowClause } from '../../../models/clause';

import './builder-screen-people';
import './builder-screen-event-operator';
import './builder-screen-events';
import './builder-screen-numeric-properties';
import './builder-show-header';

import template from './index.jade';
import './index.styl';

document.registerElement(`query-builder-show`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        showSourceForNumericProperties: () => (
          this.app.getShowClausesResource() !== ShowClause.RESOURCE_TYPE_PEOPLE
        ),
      },
    };
  }
});

document.registerElement(`builder-show-edit-control`, class extends EditControl {
  get section() {
    return ShowClause.TYPE;
  }

  getLabel() {
    let label = ``;
    const clause = this.state.report.sections.getClause(this.section, this.clauseIndex);
    if (clause.resourceType === ShowClause.RESOURCE_TYPE_PEOPLE) {
      label = clause.property ? clause.property.name : clause.value.name;
    } else {
      label = renameEvent(clause.value.name);
    }
    return label;
  }

  isPaneOpen() {
    return super.isPaneOpen() && !this.state.isEditingNumericProperty;
  }

  isRemovable() {
    return this.app.getClausesForType(this.section).length > 1;
  }

  openPane() {
    const showClauses = this.app.getClausesForType(this.section);
    const startingScreen = showClauses.length > 1 ? showClauses[0].resourceType : `sources`;
    this.app.startBuilderOnScreen(`builder-screen-${startingScreen}`);
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

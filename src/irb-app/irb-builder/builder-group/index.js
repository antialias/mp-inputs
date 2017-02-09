import { Component } from 'panel';

import { renameProperty } from '../../../util';

import { EditControl } from '../edit-control';
import { GroupClause, ShowClause } from '../../../models/clause';

import './builder-screen-group-properties';
import './property-type-prefix';

import template from './index.jade';

document.registerElement(`query-builder-group`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        moveClause: (clauseIndex, offset) => this.app.moveClause(`group`, clauseIndex, offset),
        removeClause: index => this.app.removeClause(`group`, index),
      },
    };
  }
});

document.registerElement(`builder-group-edit-control`, class extends EditControl {
  get section() {
    return GroupClause.TYPE;
  }

  getLabel() {
    const clause = this.getClause();
    return clause && clause.value && renameProperty(clause.value);
  }

  getSelectionAttrs() {
    const clause = this.getClause();
    return {
      source: clause.resourceType === ShowClause.RESOURCE_TYPE_PEOPLE ? `people` : `events`,
      selected: clause.value,
    };
  }

  labelPrefixComponent() {
    const clause = this.getClause();
    return {
      componentName: `property-type-prefix`,
      attrs: {
        'clause-index': this.clauseIndex,
        'property-type': clause.typeCast || clause.propertyType,
      },
    };
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-group-properties`);
  }
});

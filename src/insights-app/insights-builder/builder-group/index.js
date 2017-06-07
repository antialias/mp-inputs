import isEqual from 'lodash/isEqual';
import {Component} from 'panel';

import {
  extend,
  renameProperty,
} from '../../../util';

import {EditControl} from '../edit-control';
import {Clause, GroupClause, ShowClause} from '../../../models/clause';

import './builder-screen-group-datetime-options';
import './builder-screen-group-properties';
import './property-type-prefix';

import template from './index.jade';
import './index.styl';

const PADDING_OFFSET = 12;

document.registerElement(`query-builder-group`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        moveClause: (clauseIndex, offset) => this.app.moveClause(`group`, clauseIndex, offset),
        removeClause: index => this.app.removeClause(`group`, index),
        clauseUpdated: (el, idx) => this.updateStoredWidths(el, idx),
        hasLongHeader: idx => {
          const widths = this.state.groupClauseWidths[idx];
          return !!widths && widths.headerWidth > (widths.propertyWidth + PADDING_OFFSET);
        },
      },
    };
  }

  updateStoredWidths(clauseContainer, idx) {
    const groupClauseWidths = this.state.groupClauseWidths[idx] === undefined ? {} : this.state.groupClauseWidths[idx];
    let newGroupClauseWidths = extend({}, groupClauseWidths);

    const header = clauseContainer.querySelector(`.header-label`);
    const property = clauseContainer.querySelector(`.control-label`);

    newGroupClauseWidths.headerWidth = header ? header.offsetWidth : 0;
    newGroupClauseWidths.propertyWidth = property ? (property.offsetWidth - PADDING_OFFSET) : 0;

    if (!isEqual(newGroupClauseWidths, groupClauseWidths)) {
      this.app.updateGroupClauseWidths(idx, newGroupClauseWidths);
    }
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
      selected: clause.value,
      source: clause.source,
    };
  }

  labelPrefixComponent() {
    const clause = this.getClause();
    return {
      componentName: `property-type-prefix`,
      attrs: {
        'clause-index': this.clauseIndex,
        'property-type': clause.typeCast || clause.propertyType,
        'disabled-for-reserved-prop': GroupClause.EVENT_DATE.name === clause.value,
      },
    };
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-group-properties`);
  }
});

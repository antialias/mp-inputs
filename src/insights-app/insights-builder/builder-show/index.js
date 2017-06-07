import isEqual from 'lodash/isEqual';
import {Component} from 'panel';

import {
  extend,
  formatSource,
  renameEvent,
  renameProperty,
} from '../../../util';

import {EditControl} from '../edit-control';
import {Clause, ShowClause} from '../../../models/clause';

import './builder-screen-people';
import './builder-screen-event-operator';
import './builder-screen-events';
import './builder-screen-numeric-properties';
import './builder-show-header';

import template from './index.jade';
import './index.styl';

const PADDING_OFFSET = 12;

document.registerElement(`query-builder-show`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        showSourceForNumericProperties: () => !this.state.report.sections.show.isPeopleOnlyQuery(),
        clauseUpdated: (el, idx) => this.updateStoredWidths(el, idx),
        hasLongHeader: idx => {
          const widths = this.state.showClauseWidths[idx];
          return !!widths && widths.headerWidth >= widths.clauseBodyWidth + PADDING_OFFSET;
        },
      },
    };
  }

  updateStoredWidths(clauseContainer, idx) {
    const showClauseWidths = this.state.showClauseWidths[idx] === undefined ? {} : this.state.showClauseWidths[idx];
    let newShowClauseWidths = extend({}, showClauseWidths);

    const header = clauseContainer.querySelector(`.header-label`);
    const numericProperty = clauseContainer.querySelector(`builder-numeric-property-edit-control .control-container`);

    let clauseBodyWidth = clauseContainer.querySelector(`.control-container:first-of-type`).offsetWidth;
    if (numericProperty) {
      clauseBodyWidth += clauseContainer.querySelector(`.preposition`).offsetWidth;
      clauseBodyWidth += clauseContainer.querySelector(`.control-container:last-of-type`).offsetWidth;
    }

    newShowClauseWidths.headerWidth = header ? header.offsetWidth : 0;
    newShowClauseWidths.clauseWidth = clauseContainer.offsetWidth - PADDING_OFFSET;
    newShowClauseWidths.clauseBodyWidth = clauseBodyWidth;
    newShowClauseWidths.numericPropertyWidth = numericProperty ? numericProperty.offsetWidth - PADDING_OFFSET : null;

    if (!isEqual(newShowClauseWidths, showClauseWidths)) {
      this.app.updateShowClauseWidths(idx, newShowClauseWidths);
    }
  }
});

document.registerElement(`builder-show-edit-control`, class extends EditControl {
  get section() {
    return ShowClause.TYPE;
  }

  getLabel() {
    const clause = this.getClause();
    let label;

    if (clause.resourceType === ShowClause.RESOURCE_TYPE_PEOPLE) {
      let propertyName = clause.property ? clause.property.name : clause.value.name;

      if (propertyName === ShowClause.ALL_PEOPLE.name && clause.profileType) {
        propertyName = formatSource(clause.profileType, `all`);
      }

      label = renameProperty(propertyName);
    } else {
      label = renameEvent(clause.value.name);
    }

    return label || ``;
  }

  getSelectionAttrs() {
    const clause = this.getClause();
    let selected;

    if (clause.resourceType === ShowClause.RESOURCE_TYPE_PEOPLE) {
      selected = clause.property ? clause.property.name : clause.value.name;
    } else {
      selected = clause.value.name;
    }

    return {
      selected,
      source: clause.source,
    };
  }

  isPaneOpen() {
    return super.isPaneOpen() && !this.state.isEditingNumericProperty;
  }

  isRemovable() {
    return this.app.getClausesForType(this.section).length > 1;
  }

  openPane() {
    const clauses = this.app.getClausesForType(this.section);
    const resourceType = clauses[0].resourceType;
    const isAllOrEvents = [Clause.RESOURCE_TYPE_ALL, Clause.RESOURCE_TYPE_EVENTS].includes(resourceType);
    let previousScreens = [];

    let startScreen = `builder-screen-sources`;
    if (clauses.length > 1) {
      // More than one show clause, i.e user has already selected a resource type
      // Only show options for that resource type
      startScreen = isAllOrEvents ? `builder-screen-events` : `builder-screen-people`;
    }
    else if (this.app.hasDatasets()) {
      // If multiple datasets and a dataset is selected,
      // go to sources view and add back button for dataset selection
      if (this.app.getSelectedDataset() !== null) {
        previousScreens = [`builder-screen-datasets`];
      } else {
        startScreen = `builder-screen-datasets`;
      }
    }

    this.app.startBuilderOnScreen(startScreen, {previousScreens});
    this.app.update({isEditingNumericProperty: false});
  }
});

document.registerElement(`builder-numeric-property-edit-control`, class extends EditControl {
  get section() {
    return ShowClause.TYPE;
  }

  getLabel() {
    const clause = this.getClause();

    if (clause && clause.property) {
      let propertyName = clause.property.name;

      if (propertyName === ShowClause.ALL_PEOPLE.name && clause.profileType) {
        propertyName = formatSource(clause.profileType, `all`);
      }

      return renameProperty(propertyName);
    }

    return ``;
  }

  getSelectionAttrs() {
    const clause = this.getClause();
    return {
      source: clause.source,
      selected: clause.property ? clause.property.name : null,
    };
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

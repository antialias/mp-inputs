import { Component } from 'panel';

import {
  renameEvent,
  renameProperty,
} from '../../../util';

import { EditControl } from '../edit-control';
import { Clause, ShowClause } from '../../../models/clause';

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
          this.state.report.sections.show.clauseResourceTypes() !== ShowClause.RESOURCE_TYPE_PEOPLE
        ),
        mouseEntered: (ev, idx) => {
          const clauseContainer = ev.target;
          const clauseWidth = clauseContainer.offsetWidth;
          const headerWidth = clauseContainer.querySelector(`.header-label`).offsetWidth;
          const buttonWidth = 12;
          this.app.updateShowClauseButtonPosition(idx, headerWidth + buttonWidth > clauseWidth);
        },
      },
    };
  }
});

document.registerElement(`builder-show-edit-control`, class extends EditControl {
  get section() {
    return ShowClause.TYPE;
  }

  getLabel() {
    const clause = this.getClause();
    if (clause.resourceType === ShowClause.RESOURCE_TYPE_PEOPLE) {
      return renameProperty(clause.property ? clause.property.name : clause.value.name) || ``;
    }
    return renameEvent(clause.value.name);
  }

  getSelectionAttrs() {
    const clause = this.getClause();
    if (clause.resourceType === ShowClause.RESOURCE_TYPE_PEOPLE) {
      return {
        source: `people`,
        selected: clause.property ? clause.property.name : clause.value.name,
      };
    } else {
      return {
        source: `events`,
        selected: clause.value.name,
      };
    }
  }

  isPaneOpen() {
    return super.isPaneOpen() && !this.state.isEditingNumericProperty;
  }

  isRemovable() {
    return this.app.getClausesForType(this.section).length > 1;
  }

  openPane() {
    const resourceScreenMap = {
      [Clause.RESOURCE_TYPE_ALL]: Clause.RESOURCE_TYPE_EVENTS,
    };
    const showClauses = this.app.getClausesForType(this.section);
    const screenForResourceType = resourceScreenMap[showClauses[0].resourceType] || showClauses[0].resourceType;
    const startingScreen = showClauses.length > 1 ? screenForResourceType : `sources`;
    this.app.startBuilderOnScreen(`builder-screen-${startingScreen}`);
    this.app.update({isEditingNumericProperty: false});
  }
});

document.registerElement(`builder-numeric-property-edit-control`, class extends EditControl {
  get section() {
    return ShowClause.TYPE;
  }

  getLabel() {
    const clause = this.getClause();
    return clause && clause.property ? renameProperty(clause.property.name) : ``;
  }

  getSelectionAttrs() {
    const clause = this.getClause();
    return {
      source: clause.resourceType === ShowClause.RESOURCE_TYPE_PEOPLE ? `people` : `events`,
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

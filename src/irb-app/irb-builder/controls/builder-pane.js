import { extend, removeValue } from '../../../util';

import { Pane, PaneContent } from '../../pane';
import { Clause, FilterClause, TimeClause } from '../../../models/clause';
import Dropdown from '../../widgets/dropdown';
import Toggle from '../../widgets/toggle';

import propertyPaneContentTemplate from './property-pane-content.jade';
import propertyValuePaneContentTemplate from './property-value-pane-content.jade';

import './builder-pane.styl';

export class BuilderPane extends Pane {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        // backButtonHandler: () => {
          // UPDATE
          // this.app.update({stageClause: this.state.stageClause.clausePath});
        // },
      }),
    });
  }
}

export class PropertyPaneContent extends PaneContent {
  get config() {
    return extend(super.config, {
      template: propertyPaneContentTemplate,

      helpers: extend(super.config.helpers, {
        selectProperty: (property) => this.config.helpers.paneHandler(property, true),
        selectArrow: (property) => this.config.helpers.paneHandler(property, false),
        paneHandler: (property, shouldClosePane) => {
          const value = property.name;
          const filterType = property.type;
          const paneIndex = this.app.activeClausePaneIndex();

          this.config.helpers.updateStageClause({filterType, value}, shouldClosePane);

          // when a property is selected, switch to the property value inner pane
          // - requestAnimationFrame allows the add pane to be re-rendered as an
          //   edit pane, and still show the css animation sliding to the new pane
          if (!shouldClosePane) {
            if (this.section !== 'filter') {
              this.app.startAddingClause('filter', {paneIndex});
              this.app.updateStageClause({value});
            }
            window.requestAnimationFrame(() =>{
              this.app.updateStageClause({paneIndex: paneIndex + 1});
            }
            );
          }
        },
      }),
    });
  }

  get resourceTypeChoices() {
    return Clause.RESOURCE_TYPES;
  }
}

export class PropertyValuePaneContent extends PaneContent {
  get config() {
    return extend(super.config, {
      template: propertyValuePaneContentTemplate,

      helpers: extend(super.config.helpers, {
        updateStageClause: clauseData => this.app.updateStageClause(clauseData),
        showPropertyValues: () => this.state.stageClause.length && !this.app.activeStageClause.filterOperatorIsSetOrNotSet,
        getActiveClauseProperty: property => this.app.hasStageClause() ? this.app.activeStageClause[property] : false,
        getValueMatches: (string, invert) =>
          this.state.topPropertyValues
            .filter(value => !string || value.toLowerCase().indexOf(string.toLowerCase()) !== -1 ? !invert : !!invert),
        toggleStringEqualsValueSelected: value => {
          const clause = this.app.activeStageClause;
          const selected = (clause && clause.filterValue) || [];
          let filterValue;

          if (selected.indexOf(value) === -1) {
            filterValue = [...selected, value];
          } else {
            filterValue = removeValue(selected, value);
          }

          this.app.updateStageClause({filterValue});
        },
        getDoneLabel: () => this.app.isAddingClause() ? 'Add' : 'Update',
        stopEditingClause: () => this.app.stopEditingClause(),
      }),
    });
  }

  get filterTypeChoices() {
    return FilterClause.FILTER_TYPES;
  }
}


document.registerElement('operator-dropdown', class extends Dropdown {
  get choices() {
    const clause = this.app.activeStageClause;
    return clause ? FilterClause.FILTER_OPERATORS[clause.filterType] : [];
  }

  get selected() {
    return this.state.stageClause.length && this.app.activeStageClause.filterOperator;
  }

  get isOpen() {
    return this.state.stageClause.length && this.app.activeStageClause.isEditingFilterOperator;
  }

  toggleOpen() {
    const clause = this.app.activeStageClause;
    this.app.updateStageClause({
      editing: clause && clause.isEditingFilterOperator ? null : 'filterOperator',
    });
  }

  select(filterOperator) {
    this.app.updateStageClause({
      filterOperator,
      filterValue: null,
      filterSearch: null,
      editing: null,
    });
  }
});


document.registerElement('date-unit-dropdown', class extends Dropdown {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        formatChoice: choice => `${choice}s`,
      }),
    });
  }

  get choices() {
    return TimeClause.UNIT_CHOICES;
  }

  get selected() {
    return this.state.stageClause.length && this.app.activeStageClause.filterDateUnit;
  }

  get isOpen() {
    return this.state.stageClause.length && this.app.activeStageClause.isEditingFilterDateUnit;
  }

  toggleOpen() {
    const clause = this.app.activeStageClause;
    this.app.updateStageClause({
      editing: clause && clause.isEditingFilterDateUnit ? null : 'filterDateUnit',
    });
  }

  select(filterDateUnit) {
    this.app.updateStageClause({
      filterDateUnit,
      editing: null,
    });
  }
});

document.registerElement('operator-toggle', class extends Toggle {
  get choices() {
    const clause = this.app.activeStageClause;
    return clause ? FilterClause.FILTER_OPERATORS[clause.filterType] : [];
  }

  get selected() {
    return this.state.stageClause.length && this.app.activeStageClause.filterOperator;
  }

  select(filterOperator) {
    this.app.updateStageClause({filterOperator});
  }
});

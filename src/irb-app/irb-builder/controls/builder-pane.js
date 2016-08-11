import {
  extend,
  removeByValue,
  renameProperty,
  renamePropertyValue,
} from '../../../util';

import { Pane, PaneContent } from '../../pane';
import { Clause, FilterClause, ShowClause, TimeClause } from '../../../models/clause';
import Dropdown from '../../widgets/dropdown';
import Toggle from '../../widgets/toggle';

import propertyPaneContentTemplate from './property-pane-content.jade';
import propertyValuePaneContentTemplate from './property-value-pane-content.jade';
import showPaneContentTemplate from '../controls/show-pane-content.jade';

import './builder-pane.styl';

export class BuilderPane extends Pane {
  get filterPropertyValuePaneContent() {
    return {
      tag: 'filter-property-value-pane-content',
      constants: {
        search: false,
        commitLabel: 'Update',
      },
      helpers: {
        commitHandler: () => this.app.commitStageClause(),
        getHeader: () => {
          const clause = this.app.activeStageClause;
          return clause && clause.value ? renameProperty(clause.value) : '';
        },
      },
    };
  }

  get groupPropertyPaneContent() {
    return {
      tag: 'group-property-pane-content',
      constants: {
        header: 'Properties',
      },
    };
  }

  get showPaneContent() {
    return {
      tag: 'show-pane-content',
      constants: {
        header: 'Show',
      },
    };
  }
}

document.registerElement('show-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: showPaneContentTemplate,
      helpers: extend(super.config.helpers, {
        onArrowClick: (ev, value) => {
          ev.stopPropagation();
          this.app.updateStageClause({value});
          this.app.startAddingClause('group');
          window.requestAnimationFrame(() =>
            this.app.updateStageClause({paneIndex: 1})
          );
        },
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      mathChoices: ShowClause.MATH_TYPES,
      eventChoices: [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS, ...this.state.topEvents],
    });
  }

  get section() {
    return 'show';
  }

  get resourceTypeChoices() {
    return ShowClause.RESOURCE_TYPES;
  }
});

document.registerElement('group-property-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: propertyPaneContentTemplate,

      helpers: extend(super.config.helpers, {
        isSelectedProperty: (property) => (
          super.config.helpers.getActiveClauseProperty('value') === property.name &&
          super.config.helpers.getActiveClauseProperty('resourceType') === property.resourceType
        ),
        paneHandler: (property, shouldClosePane) => {
          const filterType = property.type;
          const originalValue = this.app.activeStageClause.value;
          const paneIndex = this.app.hasStageClause() ? this.app.activeStageClause.paneIndex : 0;
          const resourceType = property.resourceType;
          const value = property.name;

          this.config.helpers.updateStageClause({filterType, resourceType, value}, shouldClosePane);

          // when a property is selected, switch to the property value inner pane
          // - requestAnimationFrame allows the add pane to be re-rendered as an
          //   edit pane, and still show the css animation sliding to the new pane
          if (!shouldClosePane) {
            if (this.app.originStageClauseType() !== 'filter') {
              this.app.startAddingClause('filter', {paneIndex});
            } else if (value !== originalValue) {
              this.app.updateStageClause({filterValue: null});
            }
            this.app.updateStageClause({value, resourceType});
            window.requestAnimationFrame(() => {
              this.app.updateStageClause({paneIndex: paneIndex + 1});
            });
          }
        },
        onArrowClick: (ev, property) => {
          ev.stopPropagation();
          this.config.helpers.paneHandler(property, false);
        },
        selectProperty: property => this.config.helpers.paneHandler(property, this.app.originStageClauseType() !== 'filter'),
        topProperties: () => {
          switch (this.state.resourceTypeFilter) {
            case 'events':
              return this.state.topEventProperties;
            case 'people':
              return this.state.topPeopleProperties;
            default:
              return this.state.topEventProperties.concat(this.state.topPeopleProperties).sort((a, b) => b.count - a.count);
          }
        },
        updateResourceTypeFilter: (resourceTypeFilter) => this.app.update({resourceTypeFilter}),
      }),
    });
  }

  get resourceTypeChoices() {
    return Clause.RESOURCE_TYPES;
  }

  get section() {
    return 'group';
  }

});

document.registerElement('filter-property-value-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: propertyValuePaneContentTemplate,

      helpers: extend(super.config.helpers, {
        getDoneLabel: () => this.app.isAddingClause() ? 'Add' : 'Update',
        getEqualsMatches: () =>
          this.config.helpers.getValueMatches(this.app.activeStageClause.filterSearch),
        getValueMatches: (string, invert) =>
          this.state.topPropertyValues
            .filter(value => !string || renamePropertyValue(value).toLowerCase().indexOf(string.toLowerCase()) !== -1 ? !invert : !!invert),
        toggleStringEqualsValueSelected: value => {
          const clause = this.app.activeStageClause;
          const selected = (clause && clause.filterValue) || [];
          let filterValue;

          if (selected.indexOf(value) === -1) {
            filterValue = [...selected, value];
          } else {
            filterValue = removeByValue(selected, value);
          }

          this.app.updateStageClause({filterValue});
        },
        showPropertyValues: () => this.app.hasStageClause() && !this.app.activeStageClause.filterOperatorIsSetOrNotSet,
        stopEditingClause: () => this.app.stopEditingClause(),
        updateDate: ev => ev.detail && this.app.updateStageClause({filterValue: ev.detail}),
        updateStageClause: clauseData => this.app.updateStageClause(clauseData),
      }),
    });
  }

  get filterTypeChoices() {
    return FilterClause.FILTER_TYPES;
  }

  get section() {
    return 'filter';
  }
});

document.registerElement('operator-dropdown', class extends Dropdown {
  get choices() {
    const clause = this.app.activeStageClause;
    return clause ? FilterClause.FILTER_OPERATORS[clause.filterType] : [];
  }

  get selected() {
    return this.app.hasStageClause() ? this.app.activeStageClause.filterOperator : null;
  }

  get isOpen() {
    return this.app.hasStageClause() && this.app.activeStageClause.isEditingFilterOperator;
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
    return this.app.hasStageClause() && this.app.activeStageClause.filterDateUnit;
  }

  get isOpen() {
    return this.app.hasStageClause() && this.app.activeStageClause.isEditingFilterDateUnit;
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
    return this.app.hasStageClause() && this.app.activeStageClause.filterOperator;
  }

  select(filterOperator) {
    this.app.updateStageClause({filterOperator});
  }
});

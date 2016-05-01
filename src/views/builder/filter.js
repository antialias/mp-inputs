import BaseView from '../base';
import { AddControlView, EditControlView } from './control';
import PaneView from './pane';
import PaneContentView from './pane-content';
import DropdownView from '../widgets/dropdown';
import ToggleView from '../widgets/toggle';
import {
  extend,
  renameProperty,
  removeValue,
} from '../../util';

import { Clause, FilterClause } from '../../models/clause';

import template from '../templates/builder/filter.jade';
import propertyPaneTemplate from '../templates/builder/property-pane-content.jade';
import propertyValuePaneTemplate from '../templates/builder/property-value-pane-content.jade';

import '../stylesheets/builder/filter.styl';

class OperatorDropdownView extends DropdownView {
  setApp() {
    super.setApp(...arguments);
    this.app.onClickOutside(this.elementClass, 'stopEditingClauseAttrs');
  }

  get choices() {
    return FilterClause.FILTER_OPERATORS[this.app.state.editingClause.filterType];
  }

  get selected() {
    return this.app.state.editingClause.filterOperator;
  }

  get isOpen() {
    return this.app.state.editingClause.isEditingFilterOperator;
  }

  toggleOpen() {
    this.app.updateEditingClause({
      editing: this.app.state.editingClause.isEditingFilterOperator ? null : 'filterOperator',
    });
  }

  select(filterOperator) {
    this.app.updateEditingClause({
      filterOperator,
      filterValue: null,
      filterSearch: null,
      editing: null,
    });
  }
}

class OperatorToggleView extends ToggleView {
  get choices() {
    return FilterClause.FILTER_OPERATORS[this.app.state.editingClause.filterType];
  }

  get selected() {
    return this.app.state.editingClause.filterOperator;
  }

  select(filterOperator) {
    this.app.updateEditingClause({filterOperator});
  }
}

class DateUnitDropdownView extends DropdownView {
  setApp() {
    super.setApp(...arguments);
    this.app.onClickOutside(this.elementClass, 'stopEditingClauseAttrs');
  }

  get choices() {
    return FilterClause.FILTER_DATE_UNITS;
  }

  get selected() {
    return this.app.state.editingClause.filterDateUnit;
  }

  get isOpen() {
    return this.app.state.editingClause.isEditingFilterDateUnit;
  }

  toggleOpen() {
    this.app.updateEditingClause({
      editing: this.app.state.editingClause.isEditingFilterDateUnit ? null : 'filterDateUnit',
    });
  }

  select(filterDateUnit) {
    this.app.updateEditingClause({
      filterDateUnit,
      editing: null,
    });
  }
}

class FilterPropertyPaneContentView extends PaneContentView {
  get section() {
    return 'filter';
  }

  get TEMPLATE() {
    return propertyPaneTemplate;
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      resourceTypeChoices: Clause.RESOURCE_TYPES,
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      selectProperty: (clauseIndex, property, closePane) => {
        closePane = false; // TODO talk with design about how this interaction should work; right now it's confusing

        this.templateHelpers.updateClause(clauseIndex, {
          value: property.name,
          filterType: property.type,
        }, closePane);

        if (!closePane) {
          // when a property is selected, switch to the property value inner pane
          // - requestAnimationFrame allows the add pane to be re-rendered as an
          //   edit pane, and still show the css animation sliding to the new pane
          window.requestAnimationFrame(() =>
            super.templateHelpers.updateClause(this.app.editingClauseIndex, {paneIndex: 1})
          );
        }
      },
    });
  }
}

class FilterPropertyValuePaneContentView extends PaneContentView {
  get section() {
    return 'filter';
  }

  get TEMPLATE() {
    return propertyValuePaneTemplate;
  }

  get VIEWS() {
    return {
      operatorDropdown: new OperatorDropdownView(this),
      operatorToggle: new OperatorToggleView(this),
      dateUnitDropdown: new DateUnitDropdownView(this),
    };
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      filterTypeChoices: FilterClause.FILTER_TYPES,
      filterOperatorChoices: FilterClause.FILTER_OPERATORS,
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      updateClause: clauseData => this.app.updateEditingClause(clauseData),
      showPropertyValues: () => this.app.state.editingClause && !this.app.state.editingClause.filterOperatorIsSetOrNotSet,
      getValueMatches: (string, invert) =>
        this.app.state.topPropertyValues
          .filter(value => !string || value.toLowerCase().indexOf(string.toLowerCase()) !== -1 ? !invert : !!invert),
      toggleStringEqualsValueSelected: value => {
        const selected = this.app.state.editingClause.filterValue || [];
        let filterValue;

        if (selected.indexOf(value) === -1) {
            filterValue = [...selected, value];
        } else {
            filterValue = removeValue(selected, value);
        }

        this.app.updateEditingClause({filterValue});
      },
      getDoneLabel: () => this.app.isAddingClause() ? 'Add' : 'Update',
      stopEditingClause: () => this.app.stopEditingClause(),
    });
  }
}

class FilterPaneView extends PaneView {
  get section() {
    return 'filter';
  }

  get VIEWS() {
    return {
      panes: [
        {content: new FilterPropertyPaneContentView(this)},
        {content: new FilterPropertyValuePaneContentView(this)},
      ],
    };
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      panes: [
        {
          header: 'Properties',
        },
        {
          search: false,
          commitLabel: 'Update',
        },
      ],
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      panes: [
        {},
        {
          getHeader: () => {
            const clause = this.app.state.editingClause;
            return clause && clause.value ? renameProperty(clause.value) : '';
          },
        },
      ]
    });
  }

  get templateHandlers() {
    return extend(super.templateHandlers, {
      panes: [
        {},
        {
          commitHandler: () => this.app.stopEditingClause(),
        },
      ],
    });
  }
}

class FilterAddControlView extends AddControlView {
  get section() {
    return 'filter';
  }

  get VIEWS() {
    return {
      pane: new FilterPaneView(this),
    };
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      label: 'Filter',
    });
  }
}

class FilterEditControlView extends EditControlView {
  get section() {
    return 'filter';
  }

  get VIEWS() {
    return {
      pane: new FilterPaneView(this),
    };
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      getLabel: clauseIndex => {
        const clause = this.app.state.sections.getClause('filter', clauseIndex);
        const property = renameProperty(clause.value);
        const type = clause.filterType;
        const operator = clause.filterOperator;
        let propertyValue = [];

        if (clause.filterValue) {
          if (type === 'datetime' && (operator === 'was more than' || operator === 'was less than')) {
            propertyValue = [clause.filterValue, clause.filterDateUnit, 'ago'];
          } else {
            switch (operator) {
              case 'equals':
              case 'does not equal':
                clause.filterValue.forEach(value => {
                  propertyValue.push(value);
                  propertyValue.push('or');
                });
                propertyValue = propertyValue.slice(0, -1); // remove trailing "or"
                break;
              case 'is between':
              case 'was between':
                propertyValue = [clause.filterValue[0], 'and', clause.filterValue[1]];
                break;
              case 'is set':
              case 'is not set':
              case 'is true':
              case 'is false':
                propertyValue = [];
                break;
              default:
                propertyValue = [clause.filterValue];
                break;
            }
          }

          propertyValue = propertyValue.map(value => {
            if (value instanceof Date) {
              return `${value.getUTCMonth()}/${value.getUTCFullYear().toString().slice(2)}`;
            } else {
              return value ? value.toString() : '';
            }
          });
        }

        return [property, operator, ...propertyValue];
      },
    });
  }
}

export default class FilterView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      addControl: new FilterAddControlView(this),
      editControl: new FilterEditControlView(this),
    };
  }

  get templateHelpers() {
    return {
      isAddingClause: () => this.app.isAddingClause('filter'),
    }
  }
}

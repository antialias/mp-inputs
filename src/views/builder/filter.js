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

import { Clause, FilterClause, TimeClause } from '../../models/clause';

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
    return FilterClause.FILTER_OPERATORS[this.app.state.stageClause.filterType];
  }

  get selected() {
    return this.app.state.stageClause.filterOperator;
  }

  get isOpen() {
    return this.app.state.stageClause.isEditingFilterOperator;
  }

  toggleOpen() {
    this.app.updateStageClause({
      editing: this.app.state.stageClause.isEditingFilterOperator ? null : 'filterOperator',
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
}

class OperatorToggleView extends ToggleView {
  get choices() {
    return FilterClause.FILTER_OPERATORS[this.app.state.stageClause.filterType];
  }

  get selected() {
    return this.app.state.stageClause.filterOperator;
  }

  select(filterOperator) {
    this.app.updateStageClause({filterOperator});
  }
}

class DateUnitDropdownView extends DropdownView {
  setApp() {
    super.setApp(...arguments);
    this.app.onClickOutside(this.elementClass, 'stopEditingClauseAttrs');
  }

  get choices() {
    return TimeClause.UNIT_CHOICES;
  }

  get selected() {
    return this.app.state.stageClause.filterDateUnit;
  }

  get isOpen() {
    return this.app.state.stageClause.isEditingFilterDateUnit;
  }

  toggleOpen() {
    this.app.updateStageClause({
      editing: this.app.state.stageClause.isEditingFilterDateUnit ? null : 'filterDateUnit',
    });
  }

  select(filterDateUnit) {
    this.app.updateStageClause({
      filterDateUnit,
      editing: null,
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      formatChoice: choice => `${choice}s`,
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
      selectProperty: (property, closePane) => {
        this.templateHelpers.updateStageClause({
          value: property.name,
          filterType: property.type,
        });

        // when a property is selected, switch to the property value inner pane
        // - requestAnimationFrame allows the add pane to be re-rendered as an
        //   edit pane, and still show the css animation sliding to the new pane
        window.requestAnimationFrame(() =>
          super.templateHelpers.updateStageClause({paneIndex: 1})
        );
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
      updateStageClause: clauseData => this.app.updateStageClause(clauseData),
      showPropertyValues: () => this.app.state.stageClause && !this.app.state.stageClause.filterOperatorIsSetOrNotSet,
      getValueMatches: (string, invert) =>
        this.app.state.topPropertyValues
          .filter(value => !string || value.toLowerCase().indexOf(string.toLowerCase()) !== -1 ? !invert : !!invert),
      toggleStringEqualsValueSelected: value => {
        const selected = this.app.state.stageClause.filterValue || [];
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
            const clause = this.app.state.stageClause;
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
          commitHandler: () => this.app.commitStageClause(),
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
        let operator = clause.filterOperator;
        let propertyValue = [];

        if (type === 'datetime' && (operator === 'was more than' || operator === 'was less than')) {
          propertyValue = [clause.filterValue, `${clause.filterDateUnit}s`, 'ago'];
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
              propertyValue = [];
              break;
            case 'is true':
            case 'is false':
              propertyValue = [operator.split(' ').slice(1).join(' ')];
              operator = operator.split(' ')[0];
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
    };
  }
}

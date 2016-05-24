// Controls for filtering based on properties

import { Component } from 'panel';

import { extend, renameProperty, removeValue } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { Clause, FilterClause } from '../../../models/clause';
import { Pane, PaneContent } from '../../pane';

import './dropdowns';

import template from './index.jade';
import propertyPaneContentTemplate from '../controls/property-pane-content.jade';
import propertyValuePaneContentTemplate from '../controls/property-value-pane-content.jade';
import './index.styl';

document.registerElement('builder-filter', class extends Component {
  get config() {
    return {
      template,

      helpers: {
        isAddingClause: () => this.app.isAddingClause('filter'),
      },
    };
  }
});

// controls
document.registerElement('filter-add-control', class extends AddControl {
  get constants() {
    return extend(super.constants, {
      label: 'Filter',
    });
  }

  get section() {
    return 'filter';
  }
});

document.registerElement('filter-edit-control', class extends EditControl {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        getLabel: () => {
          const clause = this.state.sections.getClause('filter', this.clauseIndex);
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
      }),
    });
  }

  get section() {
    return 'filter';
  }
});

// dropdown content
document.registerElement('filter-pane', class extends Pane {
  get section() {
    return 'filter';
  }

  get subpanes() {
    return [
      {
        tag: 'filter-property-pane-content',
        constants: {
          header: 'Properties',
        },
      },
      {
        tag: 'filter-property-value-pane-content',
        constants: {
          search: false,
          commitLabel: 'Update',
        },
        helpers: {
          commitHandler: () => this.app.commitStageClause(),
          getHeader: () => {
            const clause = this.state.stageClause;
            return clause && clause.value ? renameProperty(clause.value) : '';
          },
        },
      },
    ];
  }
});

document.registerElement('filter-property-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: propertyPaneContentTemplate,

      helpers: extend(super.config.helpers, {
        selectProperty: property => {
          this.config.helpers.updateStageClause({
            value: property.name,
            filterType: property.type,
          });

          // when a property is selected, switch to the property value inner pane
          // - requestAnimationFrame allows the add pane to be re-rendered as an
          //   edit pane, and still show the css animation sliding to the new pane
          window.requestAnimationFrame(() =>
            super.config.helpers.updateStageClause({paneIndex: 1})
          );
        },
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      resourceTypeChoices: Clause.RESOURCE_TYPES,
    });
  }

  get section() {
    return 'filter';
  }
});

document.registerElement('filter-property-value-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: propertyValuePaneContentTemplate,

      helpers: extend(super.config.helpers, {
        updateStageClause: clauseData => this.app.updateStageClause(clauseData),
        showPropertyValues: () => this.state.stageClause && !this.state.stageClause.filterOperatorIsSetOrNotSet,
        getValueMatches: (string, invert) =>
          this.state.topPropertyValues
            .filter(value => !string || value.toLowerCase().indexOf(string.toLowerCase()) !== -1 ? !invert : !!invert),
        toggleStringEqualsValueSelected: value => {
          const selected = this.state.stageClause.filterValue || [];
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

  get constants() {
    return extend(super.constants, {
      filterTypeChoices: FilterClause.FILTER_TYPES,
      filterOperatorChoices: FilterClause.FILTER_OPERATORS,
    });
  }

  get section() {
    return 'filter';
  }
});

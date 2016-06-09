// Controls for filtering based on properties

import { Component } from 'panel';

import { extend } from '../../../util';
import { renameProperty } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { BuilderPane, PropertyPaneContent, PropertyValuePaneContent } from '../controls/builder-pane';

import template from './index.jade';
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
  get section() {
    return 'filter';
  }

  get label() {
    return 'Filter';
  }
});

document.registerElement('filter-edit-control', class extends EditControl {
  get section() {
    return 'filter';
  }

  get label() {
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
  }
});

// dropdown content
document.registerElement('filter-pane', class extends BuilderPane {
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
            const clause = this.app.activeStageClause;
            return clause && clause.value ? renameProperty(clause.value) : '';
          },
        },
      },
    ];
  }
});

document.registerElement('filter-property-pane-content', class extends PropertyPaneContent {
  get config() {
    return extend(super.config, {
      helpers: extend( super.config.helpers, {
        selectProperty: (property) => this.config.helpers.paneHandler(property, false),
      }),
    });
  }

  get section() {
    return 'filter';
  }

});


document.registerElement('filter-property-value-pane-content', class extends PropertyValuePaneContent {

  get section() {
    return 'filter';
  }

});

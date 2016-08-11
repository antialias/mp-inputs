// Controls for filtering based on properties

import { Component } from 'panel';

import { renameProperty } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { BuilderPane } from '../builder-pane';

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
    const clause = this.state.report.sections.getClause('filter', this.clauseIndex);
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
      this.groupPropertyPaneContent,
      this.filterPropertyValuePaneContent,
    ];
  }
});


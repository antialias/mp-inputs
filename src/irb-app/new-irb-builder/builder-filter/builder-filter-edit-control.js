import { EditControl } from '../edit-control';
import { FilterClause } from '../../../models/clause';
import { renameProperty } from '../../../util';

import './builder-filter-edit-control.styl';

document.registerElement(`builder-filter-edit-control`, class extends EditControl {
  get section() {
    return FilterClause.TYPE;
  }

  getLabel() {
    const clause = this.state.report.sections.getClause(`filter`, this.clauseIndex);
    const property = renameProperty(clause.value);
    const type = clause.filterType;
    let operator = clause.filterOperator;
    let propertyValue = [];

    if (type === `datetime` && (operator === `was more than` || operator === `was less than`)) {
      propertyValue = [clause.filterValue, `${clause.filterDateUnit}s`, `ago`];
    } else {
      switch (operator) {
        case `equals`:
        case `does not equal`:
          clause.filterValue.forEach(value => {
            propertyValue.push(value);
            propertyValue.push(`or`);
          });
          propertyValue = propertyValue.slice(0, -1); // remove trailing "or"
          break;
        case `is between`:
        case `was between`:
          propertyValue = [clause.filterValue[0], `and`, clause.filterValue[1]];
          break;
        case `is set`:
        case `is not set`:
          propertyValue = [];
          break;
        case `is true`:
        case `is false`:
          propertyValue = [operator.split(` `).slice(1).join(` `)];
          operator = operator.split(` `)[0];
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
        return value ? value.toString() : ``;
      }
    });

    return [property, operator, ...propertyValue];
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-filter-property`);
  }
});

import { EditControl } from '../edit-control';
import { FilterClause, TimeClause } from '../../../models/clause';
import { renameProperty, parseDate, formatDateDisplay } from '../../../util';

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
    let filterValue = Array.isArray(clause.filterValue) ? clause.filterValue : [clause.filterValue];
    let propertyValue = [];

    if (type === `datetime`) {
      filterValue = filterValue.map(value => value ? formatDateDisplay(parseDate(value)) : ``);

      if (TimeClause.RANGE_LIST.includes(operator)) {
        return [property, `was in the`, operator.toLowerCase()];
      }
    }

    switch (operator) {
      case `equals`:
      case `does not equal`:
        filterValue.forEach(value => {
          propertyValue.push(value);
          propertyValue.push(`or`);
        });
        propertyValue = propertyValue.slice(0, -1); // remove trailing "or"
        break;
      case `is between`:
      case `was between`:
        propertyValue = [filterValue[0], `and`, filterValue[1]];
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
        propertyValue = filterValue;
        break;
    }

    return [property, operator, ...propertyValue];
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-filter-property`);
  }
});

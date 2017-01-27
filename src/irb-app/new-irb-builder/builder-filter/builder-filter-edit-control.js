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
    let value = Array.isArray(clause.filterValue) ? clause.filterValue : [clause.filterValue];

    if (type === `datetime`) {
      switch (operator) {
        case `was on`:
        case `was between`:
          value = value.map(val => formatDateDisplay(parseDate(val)) || val);
          break;
        case `was in the`:
          value = [TimeClause.UNIT_AND_VALUE_TO_RANGE[clause.filterDateUnit][clause.filterValue].toLowerCase()];
          break;
      }
    }

    switch (operator) {
      case `equals`:
      case `does not equal`:
        value = value.reduce((arr, val, idx) => (
          arr.concat(idx ? [`or`, val] : [val])
        ), []);
        break;
      case `is between`:
      case `was between`:
        value = [value[0], `and`, value[1]];
        break;
      case `is set`:
      case `is not set`:
        value = [];
        break;
      case `is true`:
      case `is false`:
        value = [operator.split(` `).slice(1).join(` `)];
        operator = operator.split(` `)[0];
        break;
    }

    return [property, operator, ...value];
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-filter-property`);
  }
});

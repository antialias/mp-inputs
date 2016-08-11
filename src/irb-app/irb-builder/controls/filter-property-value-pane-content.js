import { FilterClause } from '../../../models/clause';
import { PaneContent } from '../../pane';
import {
  extend,
  removeByValue,
  renamePropertyValue,
} from '../../../util';

import template from './filter-property-value-pane-content.jade';

document.registerElement('filter-property-value-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template,

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

// filter choices for one property
// (screen 2 of filter)

import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { FilterClause } from '../../../models/clause';
import {
  extend,
  getIconForPropertyType,
  removeByValue,
  renamePropertyValue,
} from '../../../util';

import template from './builder-screen-filter-property.jade';

document.registerElement(`builder-screen-filter-property`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        FILTER_TYPES: FilterClause.FILTER_TYPES.map(name => ({
          name,
          icon: getIconForPropertyType(name),
        })),

        // screen/type selection
        chooseFilterOperator: filterOperator => {
          this.helpers.updateMenu(`operator`, false);
          this.app.updateStageClause({filterOperator});
        },
        chooseFilterType: filterType => {
          this.helpers.updateMenu(`type`, false);
          this.app.updateStageClause({filterType});
        },
        filterOperators: filterType => FilterClause.FILTER_OPERATORS[filterType],
        getActiveClause: () => this.app.hasStageClause() ? this.app.activeStageClause : {},

        // dropdowns
        isMenuOpen: menu => {
          const currentScreen = this.app.getBuilderCurrentScreen();
          return !!currentScreen && !!currentScreen[`${menu}MenuOpen`];
        },
        menuChange: (ev, menu) => // check for close
          ev.detail && ev.detail.state === `closed` && this.helpers.updateMenu(menu, false),
        toggleMenu: menu => this.helpers.updateMenu(menu, !this.helpers.isMenuOpen(menu)),
        updateMenu: (menu, open) => this.app.updateBuilderCurrentScreen({[`${menu}MenuOpen`]: open}),

        // filter content selection
        allEqualsValuesSelected: () => false, // TODO implement me!
        getContainsMatches: () =>
          this.helpers.getValueMatches(
            this.app.activeStageClause.filterValue,
            this.app.activeStageClause.filterOperator === `does not contain`
          ),
        getEqualsMatches: () =>
          this.helpers.getValueMatches(this.app.activeStageClause.filterSearch),
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
        updateFilterString: ev => this.app.updateStageClause({filterValue: ev.target.value}),
        commitFilter: () => this.updateAndCommitStageClause(),
      }),
    };
  }

  shouldUpdate(state) {
    const clause = this.app.getActiveStageClause(state);
    return clause && !!clause.filterType;
  }
});

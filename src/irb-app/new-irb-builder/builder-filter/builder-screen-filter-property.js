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
          const clause = this.app.getActiveStageClause();
          if (clause.filterOperator != filterOperator) {
            this.resetProgressiveList();
            this.app.updateStageClause({filterOperator});
          }
        },
        chooseFilterType: filterType => {
          this.helpers.updateMenu(`type`, false);
          const clause = this.app.getActiveStageClause();
          if (clause.filterType != filterType) {
            this.resetProgressiveList();
            this.app.updateStageClause({filterType});
          }
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
        getValueMatches: (string, invert) => {
          if (typeof string !== `string`) {
            string = ``;
          }
          const list = this.state.topPropertyValues
            .filter(value =>
              !string ||
              renamePropertyValue(value).toLowerCase().indexOf(string.toLowerCase()) !== -1 ? !invert : !!invert
            );
          this._progressiveListLength = list.length;
          return list.slice(0, this.progressiveListSize);
        },
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
        updateFilterValue: filterValue => {
          this.resetProgressiveList();
          this.app.updateStageClause({filterValue});
        },
        commitFilter: () => this.updateAndCommitStageClause(),
      }),
    };
  }

  progressiveListLength() {
    return this._progressiveListLength || 0;
  }

  shouldUpdate(state) {
    const clause = this.app.getActiveStageClause(state);
    return clause && !!clause.filterType;
  }
});

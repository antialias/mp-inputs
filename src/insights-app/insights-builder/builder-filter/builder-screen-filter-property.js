// filter choices for one property
// (screen 2 of filter)

import {BuilderScreenBase} from '../builder-pane/builder-screen-base';
import {FilterClause, TimeClause} from '../../../models/clause';
import BaseQuery from '../../../models/queries/base';
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

        FILTER_OPERATORS: Object.assign(...FilterClause.FILTER_TYPES.map(type => {
          let operators = FilterClause.FILTER_OPERATORS[type];

          if (type === `datetime`) {
            operators = operators.filter(op => ![
              `was less than`, `was more than`, `was before`, `was after`,
            ].includes(op));
          }

          return {[type]: operators};
        })),

        TIME_RANGE_NAMES: TimeClause.RANGE_LIST.filter(range => range !== TimeClause.RANGES.CUSTOM),
        TIME_RANGE_VALUES: TimeClause.RANGE_TO_VALUE_AND_UNIT,

        // screen/type selection
        chooseFilterOperator: filterOperator => {
          this.helpers.updateMenu(`operator`, false);
          const clause = this.app.getActiveStageClause();
          if (clause.filterOperator !== filterOperator) {
            this.resetProgressiveList();
            this.app.updateStageClause({filterOperator, filterValue: null});
          }
        },
        chooseFilterType: filterType => {
          this.helpers.updateMenu(`type`, false);
          const clause = this.app.getActiveStageClause();
          if (clause.filterType !== filterType) {
            this.resetProgressiveList();
            this.app.updateStageClause({filterType});
          }
        },

        clickedBackButton: () => {
          this.app.updateStageClause({filterValue: null});
          this.previousScreen();
        },

        getActiveClause: () => this.app.hasStageClause() ? this.app.activeStageClause : {},
        getMaxDataHistoryDays: () => this.app.maxDataHistoryDays(),
        // dropdowns
        isMenuOpen: menu => !!this.app.getBuilderCurrentScreenAttr(`${menu}MenuOpen`),
        menuChange: (ev, menu) => // check for close
          ev.detail && ev.detail.state === `closed` && this.helpers.updateMenu(menu, false),
        toggleMenu: menu => this.helpers.updateMenu(menu, !this.helpers.isMenuOpen(menu)),
        updateMenu: (menu, open) => this.app.updateBuilderCurrentScreen({[`${menu}MenuOpen`]: open}),

        // filter content selection
        allEqualsValuesSelected: () => {
          const selected = this.app.activeStageClause.filterValue;
          if (!Array.isArray(selected)) {
            return false;
          } else {
            const values = new Set(this.helpers.getValueMatches(
              this.app.activeStageClause.filterSearch, {progressive: false}
            ));
            return values.size === selected.length && selected.every(val => values.has(val));
          }
        },
        clickedContainsMatch: filterValue => this.updateStageClause({filterValue}),
        getContainsMatches: () =>
          this.helpers.getValueMatches(
            this.app.activeStageClause.filterValue,
            this.app.activeStageClause.filterOperator === `does not contain`
          ),
        getEqualsMatches: () =>
          this.helpers.getValueMatches(this.app.activeStageClause.filterSearch),
        getValueMatches: (string, {invert=false, progressive=true}={}) => {
          if (typeof string !== `string`) {
            string = ``;
          }
          let list = this.app.getTopPropertyValues();
          if (string) {
            list = list.filter(value =>
              renamePropertyValue(value).toLowerCase().indexOf(string.toLowerCase()) !== -1 ? !invert : !!invert
            );
          }
          if (progressive) {
            this._progressiveListLength = list.length;
            return list.slice(0, this.progressiveListSize);
          } else {
            return list;
          }
        },
        toggleAllFilterValues: () => {
          let filterValue = [];
          if (!this.helpers.allEqualsValuesSelected()) {
            filterValue = this.helpers.getValueMatches(
              this.app.activeStageClause.filterSearch, {progressive: false}
            );
          }
          this.app.updateStageClause({filterValue});
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
        updateFilterSearch: filterSearch => {
          this.resetProgressiveList();
          this.app.updateStageClause({filterSearch});
        },
        updateFilterValue: (filterValue, filterDateUnit=null) => {
          this.resetProgressiveList();
          this.app.updateStageClause({filterValue, filterDateUnit});
        },
        commitFilter: () => {
          this.updateAndCommitStageClause();
        },
        resizedCalendar: () => this.updateRenderedSize({
          cancelDuringTransition: true,
        }),
      }),
    };
  }

  isLoading() {
    return this.app.getTopPropertyValues() === BaseQuery.LOADING;
  }

  progressiveListLength() {
    return this._progressiveListLength || 0;
  }

  shouldUpdate(state) {
    const clause = this.app.getActiveStageClause(state);
    return clause && !!clause.filterType;
  }
});

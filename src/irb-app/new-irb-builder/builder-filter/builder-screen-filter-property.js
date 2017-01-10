// filter choices for one property
// (screen 2 of filter)

import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { FilterClause } from '../../../models/clause';
import { extend, getIconForPropertyType } from '../../../util';

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

        chooseFilterOperator: filterOperator => {
          this.config.helpers.updateMenu(`operator`, false);
          this.app.updateStageClause({filterOperator});
        },
        chooseFilterType: filterType => {
          this.config.helpers.updateMenu(`type`, false);
          this.app.updateStageClause({filterType});
        },
        filterOperators: filterType => FilterClause.FILTER_OPERATORS[filterType],
        getActiveClause: () => this.app.hasStageClause() ? this.app.activeStageClause : {},

        // dropdowns
        isMenuOpen: menu => {
          const currentScreen = this.app.getBuilderCurrentScreen();
          return !!currentScreen && !!currentScreen[`${menu}MenuOpen`];
        },
        toggleMenu: menu => this.config.helpers.updateMenu(menu, !this.config.helpers.isMenuOpen(menu)),
        updateMenu: (menu, open) => this.app.updateBuilderCurrentScreen({[`${menu}MenuOpen`]: open}),
      }),
    };
  }
});

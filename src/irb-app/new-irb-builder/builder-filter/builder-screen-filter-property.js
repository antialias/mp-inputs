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

        getActiveClause: () => this.app.hasStageClause() ? this.app.activeStageClause : {},
        isTypeMenuOpen: () => !!this.app.getBuilderCurrentScreen().typeMenuOpen,
        toggleTypeMenu: () => this.app.updateBuilderCurrentScreen({typeMenuOpen: !this.config.helpers.isTypeMenuOpen()}),
      }),
    };
  }
});

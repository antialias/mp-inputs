// filter choices for one property
// (screen 2 of filter)

import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { extend } from '../../../util';

import template from './builder-screen-filter-property.jade';

document.registerElement(`builder-screen-filter-property`, class extends BuilderScreenBase {
  get config() {
    return {
      helpers: extend(super.config.helpers, {
        getActiveClause: () => this.app.hasStageClause() ? this.app.activeStageClause : {},
      }),

      template,
    };
  }
});

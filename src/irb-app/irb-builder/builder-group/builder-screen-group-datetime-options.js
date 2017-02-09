import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import { extend, renameProperty } from '../../../util';

import template from './builder-screen-group-datetime-options.jade';

document.registerElement(`builder-screen-group-datetime-options`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        availableUnits: () => {
          return TimeClause.UNIT_LIST;
        },
        clickedUnit: unit => this.updateAndCommitStageClause({unit}),
        getStagedProperty: () => {
          const clause = this.app.getActiveStageClause()
          return clause && renameProperty(clause.value);
        },
      }),
    };
  }
});

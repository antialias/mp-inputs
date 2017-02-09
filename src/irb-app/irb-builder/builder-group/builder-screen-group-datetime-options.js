import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import { capitalize, extend } from '../../../util';

import template from './builder-screen-group-datetime-options.jade';

const UNIT_LIST = TimeClause.UNIT_LIST.map(name => ({name: capitalize(name)}));

document.registerElement(`builder-screen-group-datetime-options`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        availableUnits: () => this.matchingItems(UNIT_LIST),
        clickedUnit: unit => this.updateAndCommitStageClause({unit: unit.toLowerCase()}),
        getGroupClause: () => (this.app.getActiveStageClause() || {}),
      }),
    };
  }
});

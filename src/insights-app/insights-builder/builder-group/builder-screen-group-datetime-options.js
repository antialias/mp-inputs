import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { TimeClause } from '../../../models/clause';
import { capitalize, extend } from '../../../util';

import template from './builder-screen-group-datetime-options.jade';

const TIME_UNIT_LIST = TimeClause.TIME_UNIT_LIST.map(name => ({name: capitalize(name), value: name}));

document.registerElement(`builder-screen-group-datetime-options`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        availableUnits: () => this.matchingItems(TIME_UNIT_LIST),
        clickedUnit: unit => this.updateAndCommitStageClause({unit: unit.value, editing: false}),
        getGroupClause: () => (this.app.getActiveStageClause() || {}),
      }),
    };
  }
});

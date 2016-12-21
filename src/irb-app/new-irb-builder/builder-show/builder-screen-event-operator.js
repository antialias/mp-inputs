import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { ShowClause } from '../../../models/clause';
import { extend } from '../../../util';

import template from './builder-screen-event-operator.jade';

document.registerElement(`builder-screen-event-operator`, class extends BuilderScreenBase {
  get config() {
    return {
      template,

      helpers: extend(super.config.helpers, {
        MATH_TYPES: ShowClause.MATH_TYPES,
        mathTypeClicked: clauseData => {
          this.app.updateClause(`show`, this.state.activeMathMenuIndex, clauseData);
          this.app.stopEditingClause();
        },
      }),
    };
  }
});

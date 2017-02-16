import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { ShowClause } from '../../../models/clause';
import { extend } from '../../../util';

import template from './builder-screen-event-operator.jade';

document.registerElement(`builder-screen-event-operator`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        mathTypeClicked: math => {
          this.app.updateClause(`show`, this.state.activeMathMenuIndex, {math});
          this.app.stopEditingClause();
        },
        getMathTypes: () => {
          const clauses = this.app.getClausesForType(ShowClause.TYPE);
          const clauseIndex = this.state.activeMathMenuIndex;
          const numericPropSelected = clauses[clauseIndex] && clauses[clauseIndex].property;

          // Filter out unique mathType if the show clause has a numeric property selected
          return ShowClause.MATH_TYPES.filter(mathType => numericPropSelected ? mathType !== ShowClause.MATH_TYPE_UNIQUE : true);
        },
      }),
    };
  }
});

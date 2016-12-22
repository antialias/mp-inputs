import { BuilderScreenBase } from './builder-screen-base';
import { GroupClause, ShowClause } from '../../../models/clause';
import { extend } from '../../../util';

import template from './builder-screen-contextual.jade';

document.registerElement(`builder-screen-contextual`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        clickedOption: option => {
          switch (option.clauseType) {
            case ShowClause.TYPE:
              this.app.stopEditingClause();
              this.app.startAddingClause(option.clauseType);
              this.nextScreen(`builder-screen-events`);
              break;
            case GroupClause.TYPE:
              this.app.stopEditingClause();
              this.app.startAddingClause(option.clauseType);
              this.nextScreen(`builder-screen-group-properties`);
              break;
          }
        },
        getContextOptions: () => {
          const showClauseType = this.app.getShowClausesType();
          const options = [{name: `Group by a property`, clauseType: GroupClause.TYPE}];
          if ([ShowClause.RESOURCE_TYPE_EVENTS, ShowClause.RESOURCE_ALL_EVENTS].includes(showClauseType)) {
            options.concat({name: `Compare to an event`, clauseType: ShowClause.TYPE});
          }
          return options;
        },
      }),
    };
  }
});

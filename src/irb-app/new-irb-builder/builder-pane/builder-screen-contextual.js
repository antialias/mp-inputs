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
          const {clauseType} = option;
          switch (clauseType) {
            case ShowClause.TYPE: {
              const resourceType = this.state.report.sections.show.clauseResourceTypes();
              this.app.stopEditingClause();
              this.app.startAddingClause(clauseType, {resourceType});
              this.nextScreen(`builder-screen-${resourceType}`);
              break;
            }
            case GroupClause.TYPE:
              this.app.stopEditingClause();
              this.app.startAddingClause(clauseType);
              this.nextScreen(`builder-screen-group-properties`);
              break;
          }
        },
        getContextOptions: () => {
          const showClauseType = this.state.report.sections.show.clauseResourceTypes();
          let options = [];
          if (showClauseType === ShowClause.RESOURCE_TYPE_EVENTS) {
            options = [
              {name: `Group by a property`, clauseType: GroupClause.TYPE},
              {name: `Compare to an event`, clauseType: ShowClause.TYPE},
            ];
          } else if (showClauseType === ShowClause.RESOURCE_TYPE_PEOPLE) {
            options = [
              {name: `Group by a people property`, clauseType: GroupClause.TYPE},
              {name: `Compare to a people property`, clauseType: ShowClause.TYPE},
            ];
          }
          return options;
        },
      }),
    };
  }
});

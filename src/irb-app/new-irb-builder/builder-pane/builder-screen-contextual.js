import { BuilderScreenBase } from './builder-screen-base';
import { GroupClause, ShowClause } from '../../../models/clause';
import { extend } from '../../../util';

import template from './builder-screen-contextual.jade';

const CONTEXTUAL_OPTIONS = {
  [ShowClause.RESOURCE_TYPE_EVENTS]: [
    {name: `Group by a property`, clauseType: GroupClause.TYPE},
    {name: `Compare to an event`, clauseType: ShowClause.TYPE},
  ],
};

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
          const firstShowClause = this.state.report.sections.getClause(ShowClause.TYPE, 0);
          let options = [];
          switch (firstShowClause.resourceType) {
            case ShowClause.RESOURCE_TYPE_ALL:
            case ShowClause.RESOURCE_TYPE_EVENTS:
              options = CONTEXTUAL_OPTIONS[ShowClause.RESOURCE_TYPE_EVENTS];
              break;
          }
          return options;
        },
        optionList: option => {
          var filter = this.state.contextFilter;
          if (!filter.length) {
            return [];
          }

          switch(option.clauseType) {
            case `group`:
              return this.state.topEventProperties;
            case `show`:
              return this.state.topEvents;
            default:
              return [];
          }
        },
      }),
    };
  }
});

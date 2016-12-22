import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { ShowClause } from '../../../models/clause';

import {
  extend,
} from '../../../util';

import template from './builder-screen-people.jade';

document.registerElement(`builder-screen-people`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        clickedProperty: (ev, property) => {
          const stageClause = {
            property,
            value: ShowClause.ALL_PEOPLE,
          };
          this.updateStageClause(stageClause, {shouldCommit: true, shouldStopEditing: true});
        },
        getProperties: () => {
          return this.state.topPeopleProperties.filter(prop => prop.type === `number`);
        },
        isLoading: () => !!this.state.topPeopleProperties,
      }),
    };
  }
});

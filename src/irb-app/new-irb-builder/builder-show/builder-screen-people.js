import { BuilderScreenNumericPropertiesBase } from '../builder-pane/builder-screen-numeric-properties-base';
import BaseQuery from '../../../models/queries/base';
import { ShowClause } from '../../../models/clause';
import { extend } from '../../../util';

import template from './builder-screen-people.jade';

document.registerElement(`builder-screen-people`, class extends BuilderScreenNumericPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        clickedSpecialOptions: (ev, value) => {
          this.updateAndCommitStageClause({value, property: null});
        },
        getSpecialOptions: () => [extend(ShowClause.ALL_PEOPLE, {icon: `profile`})],
      }),
    };
  }

  isLoading() {
    return this.state.topPeopleProperties === BaseQuery.LOADING;
  }

  buildList() {
    return this.filterNonNumericProperties(super.buildList(ShowClause.RESOURCE_TYPE_PEOPLE));
  }
});

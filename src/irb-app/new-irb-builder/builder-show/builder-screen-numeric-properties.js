import { BuilderScreenNumericPropertiesBase } from '../builder-pane/builder-screen-numeric-properties-base';
import { ShowClause } from '../../../models/clause';
import BaseQuery from '../../../models/queries/base';
import { extend } from '../../../util';

import template from './builder-screen-numeric-properties.jade';

document.registerElement(`builder-screen-numeric-properties`, class extends BuilderScreenNumericPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getEventName: () => this.getEventName(),
        clickedProperty: (ev, property) => this.updateAndCommitStageClause({property}),
      }),
    };
  }

  getRelevantBuilderEvents() {
    const stageClause = this.app.activeStageClause;
    return stageClause && stageClause.value ? [stageClause.value] : [];
  }

  getEventName() {
    const mpEvent = this.getRelevantBuilderEvents()[0];
    return mpEvent ? mpEvent.name : null;
  }

  isLoading() {
    return this.state.topEventPropertiesByEvent[this.getEventName()] === BaseQuery.LOADING;
  }

  buildList() {
    return this.filterNonNumericProperties(super.buildList(ShowClause.RESOURCE_TYPE_EVENTS));
  }
});

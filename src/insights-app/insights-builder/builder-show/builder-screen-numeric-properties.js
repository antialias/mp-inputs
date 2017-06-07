import {BuilderScreenNumericPropertiesBase} from '../builder-pane/builder-screen-numeric-properties-base';
import BaseQuery from '../../../models/queries/base';
import {Clause, ShowClause} from '../../../models/clause';
import {extend, renameEvent} from '../../../util';

import template from './builder-screen-numeric-properties.jade';

document.registerElement(`builder-screen-numeric-properties`, class extends BuilderScreenNumericPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getPropertySections: () => {
          return [{
            isLoading: this.isLoading(),
            items: this.getProperties(),
          }];
        },

        getEventLabel: () => {
          const eventName = this.getEventName();
          return eventName ? renameEvent(eventName) : null;
        },

        clickedProperty: ev => {
          const property = ev.detail.item;
          this.updateAndCommitStageClause({property});
          this.app.updateBuilder({isContextualMenuOpen: false});
        },
      }),
    };
  }

  getRelevantBuilderEvents() {
    const stageClause = this.app.activeStageClause;
    return stageClause && stageClause.value ? [stageClause.value] : [];
  }

  // get the event this property screen is currently showing properties for
  getEvent() {
    return this.getRelevantBuilderEvents()[0] || null;
  }

  // get the name of the event this property screen is currently showing properties for
  getEventName() {
    const mpEvent = this.getEvent();
    return mpEvent ? mpEvent.name : null;
  }

  isLoading() {
    return this.app.getTopEventProperties(this.getEvent()) === BaseQuery.LOADING;
  }

  buildList() {
    return this.filterNonNumericProperties(super.buildList(Clause.RESOURCE_TYPE_EVENTS));
  }
});

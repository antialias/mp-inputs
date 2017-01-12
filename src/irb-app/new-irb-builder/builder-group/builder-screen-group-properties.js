import { BuilderScreenPropertiesBase } from '../builder-pane/builder-screen-properties-base';
import { extend } from '../../../util';

import { Clause } from '../../../models/clause';

import template from './builder-screen-group-properties.jade';

document.registerElement(`builder-screen-group-properties`, class extends BuilderScreenPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        clickedProperty: (ev, property) => {
          this.app.updateRecentProperties(property);
          this.updateAndCommitStageClause({
            propertyType: property.type,
            resourceType: property.resourceType,
            value: property.name,
          });
        },
        isEventsOnlyQuery: () => (
          this.state.report.sections.show.clauseResourceTypes() === Clause.RESOURCE_TYPE_EVENTS
        ),
      }),
    };
  }
});

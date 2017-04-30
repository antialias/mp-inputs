import {BuilderScreenPropertiesBase} from '../builder-pane/builder-screen-properties-base';
import {extend} from '../../../util';

import {Clause} from '../../../models/clause';

import template from './builder-screen-group-properties.jade';

document.registerElement(`builder-screen-group-properties`, class extends BuilderScreenPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getPropertySections: () => {
          return this.processSections(this.getPropertySections());
        },
        clickedProperty: (ev, property) => {
          this.app.updateRecentProperties(property);
          const newClause = {
            propertyType: property.type,
            resourceType: property.resourceType,
            typeCast: null,
            value: property.name,
          };
          if (property.type === `datetime`) {
            const stagedClause = this.app.getActiveStageClause();
            newClause.editing = true;
            newClause.unit = stagedClause.value === property.name ? stagedClause.unit : null;
            this.updateStageClause(newClause);
            this.nextScreen(`builder-screen-group-datetime-options`);
          } else {
            this.updateAndCommitStageClause(newClause);
          }
        },
        isEventsOnlyQuery: () => (
          this.state.report.sections.show.clauseResourceTypes() === Clause.RESOURCE_TYPE_EVENTS
        ),
      }),
    };
  }

  processSections(sections) {
    return sections.map(section => extend(section, {
      items: section.items.map(item => extend(item, {
        hasCaret: item.type === `datetime`,
      })),
    }));
  }
});

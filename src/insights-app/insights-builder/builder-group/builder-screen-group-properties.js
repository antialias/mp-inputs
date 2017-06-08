import {BuilderScreenPropertiesBase} from '../builder-pane/builder-screen-properties-base';
import {Clause} from '../../../models/clause';
import {extend, formatSource} from '../../../util';

import template from './builder-screen-group-properties.jade';

document.registerElement(`builder-screen-group-properties`, class extends BuilderScreenPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getScreenTitle: () => {
          if (this.getSelectedResourceType() === Clause.RESOURCE_TYPE_PEOPLE) {
            const formattedSource = formatSource(this.getSelectedSource(), {article: true});
            return `Group by ${formattedSource} property`;
          } else {
            return `Group by a property`;
          }
        },
        getPropertySections: () => this.processSections(this.getPropertySections()),
        clickedProperty: ev => {
          const property = ev.detail.item;
          this.app.updateRecentProperties(property);

          const clauseAttrs = {
            typeCast: null,
            value: property.name,
            propertyType: property.type,
            resourceType: property.resourceType,
            profileType: property.profileType,
            dataset: property.dataset,
          };

          if (property.type === `datetime`) {
            const stagedClause = this.app.getActiveStageClause();
            clauseAttrs.editing = true;
            clauseAttrs.unit = stagedClause.value === property.name ? stagedClause.unit : null;
            this.updateStageClause(clauseAttrs);
            this.nextScreen(`builder-screen-group-datetime-options`);
          } else {
            this.updateAndCommitStageClause(clauseAttrs);
          }
        },
        isEventsOnlyQuery: () => this.state.report.sections.show.isEventsOnlyQuery(),
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

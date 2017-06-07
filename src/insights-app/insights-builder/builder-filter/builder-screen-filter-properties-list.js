import {BuilderScreenPropertiesBase} from '../builder-pane/builder-screen-properties-base';
import {extend} from '../../../util';

import template from './builder-screen-filter-properties-list.jade';

document.registerElement(`builder-screen-filter-properties-list`, class extends BuilderScreenPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        clickedProperty: ev => {
          ev.stopPropagation();
          const property = ev.detail.item;
          this.updateStageClause({
            dataset: property.dataset,
            filterType: property.type,
            filterValue: null,
            resourceType: property.resourceType,
            profileType: property.profileType,
            value: property.name,
          });
          this.app.updateRecentProperties(property);
          this.nextScreen(`builder-screen-filter-property`);
        },
      }),
    };
  }

  getPropertySections() {
    return super.getPropertySections().map(section => extend(section, {
      items: section.items.map(item => extend(item, {hasCaret: true})),
    }));
  }
});

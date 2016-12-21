import { BuilderScreenPropertiesBase } from '../builder-pane/builder-screen-properties-base';
import { extend } from '../../../util';

import template from './builder-screen-filter-properties-list.jade';

document.registerElement(`builder-screen-filter-properties-list`, class extends BuilderScreenPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        clickedProperty: (ev, property) => {
          ev.stopPropagation();
          this.updateStageClause({
            filterType: property.type,
            resourceType: property.resourceType,
            value: property.name,
          });
          this.nextScreen(`builder-screen-filter-property`);
        },
      }),
    };
  }
});

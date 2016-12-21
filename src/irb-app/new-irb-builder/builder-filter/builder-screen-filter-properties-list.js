import { BuilderScreenProperties } from '../builder-pane';
import { extend } from '../../../util';

import template from './builder-screen-filter-properties-list.jade';

document.registerElement(`builder-screen-filter-properties-list`, class extends BuilderScreenProperties {
  get config() {
    return {
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
      template,
    };
  }
});

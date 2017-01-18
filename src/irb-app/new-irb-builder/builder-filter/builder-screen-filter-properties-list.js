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
          this.app.updateRecentProperties(property);
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

  // TODO remove me after general min-height fix is shipped
  createPaneSizeStyle(screens) {
    const lastScreen = screens[screens.length - 1];
    return {
      width: `${lastScreen.width}px`,
      height: `${lastScreen.height}px`,
    };
  }
});

import { BuilderScreenPropertiesBase } from '../builder-pane/builder-screen-properties-base';
import { extend } from '../../../util';

import template from './builder-screen-group-properties.jade';

document.registerElement(`builder-screen-group-properties`, class extends BuilderScreenPropertiesBase {
  get config() {
    return {
      template,

      helpers: extend(super.config.helpers, {
        clickedProperty: (ev, property) => this.updateAndCommitStageClause({
          resourceType: property.resourceType,
          value: property.name,
        }),
      }),
    };
  }
});

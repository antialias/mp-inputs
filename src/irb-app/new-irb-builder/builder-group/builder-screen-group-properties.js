import { BuilderScreenProperties } from '../builder-pane';
import { extend } from '../../../util';

import template from './builder-screen-group-properties.jade';

document.registerElement(`builder-screen-group-properties`, class extends BuilderScreenProperties {
  get config() {
    return {
      template,

      helpers: extend(super.config.helpers, {
        clickedProperty: (ev, property) => this.updateStageClause({
          resourceType: property.resourceType,
          value: property.name,
        }, {
          shouldCommit: true,
          shouldStopEditing: true,
        }),
      }),
    };
  }
});

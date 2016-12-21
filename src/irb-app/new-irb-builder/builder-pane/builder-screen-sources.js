import { BuilderScreenBase } from './builder-screen-base';
import { extend } from '../../../util';

import template from './builder-screen-sources.jade';

const SOURCES = [
  {name: `Event`, resourceType: `events`},
  {name: `People`, resourceType: `people`},
];

document.registerElement(`builder-screen-sources`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        SOURCES,
        clickedSource: source => {
          const {resourceType} = source;
          this.updateStageClause({resourceType});
          this.nextScreen(`builder-screen-${resourceType}`);
        },
      }),
    };
  }
});

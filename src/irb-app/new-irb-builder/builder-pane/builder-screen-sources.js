import { BuilderScreenBase } from './builder-screen-base';
import { Clause } from '../../../models/clause';

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
          this.updateStageClause({resourceType, value: {}});
          this.nextScreen(`builder-screen-${resourceType}`);
        },
        getFilteredLists: () => [
          {
            label: `Events`,
            list: this.allMatchingEvents(),
            resourceType: `event`,
            itemOptions: {
              clickedEvent: this.helpers.clickedEvent,
              clickedEventProperties: this.helpers.clickedEventProperties,
              showPill: true,
            },
          },
          {
            label: `People properties`,
            list: this.allMatchingProperties(Clause.RESOURCE_TYPE_PEOPLE),
            resourceType: `property`,
          },
        ],
      }),
    };
  }
});

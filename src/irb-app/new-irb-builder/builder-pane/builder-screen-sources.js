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
        getSources: () => {
          this.updateScreensRenderedSize();
          return SOURCES;
        },

        clickedSource: source => {
          const {resourceType} = source;
          this.updateStageClause({resourceType, value: {}});
          this.nextScreen(`builder-screen-${resourceType}`);
        },
        getFilteredLists: () => {
          this.updateScreensRenderedSize();
          return this.buildProgressiveList();
        },
      }),
    };
  }

  buildList() {
    return [
      {
        label: `Events`,
        list: this.allMatchingEvents(),
        resourceType: `event`,
        itemOptions: {
          clickedEvent: this.config.helpers.clickedEvent,
          clickedEventProperties: this.config.helpers.clickedEventProperties,
          showPill: true,
        },
      },
      {
        label: `People properties`,
        list: this.allMatchingProperties(Clause.RESOURCE_TYPE_PEOPLE),
        resourceType: `property`,
      },
    ];
  }

  buildProgressiveList() {
    let listSize = this.progressiveListSize;
    const fullList = this.buildList();
    const outList = [];
    while (listSize > 0 && fullList.length) {
      let source = fullList.shift();
      outList.push(extend(source, {list: source.list.slice(0, listSize)}));
      listSize -= source.list.length;
    }
    return outList;
  }

  progressiveListLength() {
    return this.buildList().reduce((sum, source) => sum + source.list.length, 0);
  }
});

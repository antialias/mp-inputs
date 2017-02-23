import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import {
  extend,
  indexSectionLists,
  renameEvent,
} from '../../../util';

import template from './builder-screen-events.jade';

document.registerElement(`builder-screen-events`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getEventSections: () => this.getAllEvents().filter(section => section.list.length),
      }),
    };
  }

  getAllEvents() {
    let sections = [{
      label: `Recently Viewed`,
      list: this.getRecentEvents(),
    }, {
      label: `Events`,
      list: this.buildProgressiveList(),
    }];

    return indexSectionLists(sections);
  }

  getRecentEvents() {
    return this.matchingItems(this.state.recentEvents.slice(0, 3), renameEvent)
      .map(mpEvent => Object.assign(mpEvent, {section: `recent`}));
  }

  buildList() {
    return this.allMatchingEvents();
  }
});

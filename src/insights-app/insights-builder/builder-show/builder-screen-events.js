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
        getEventSections: () => this.getAllEvents(),
      }),
    };
  }

  getAllEvents() {
    let sections = [];

    sections.push({
      label: `Recently Viewed`,
      list: this.getRecentEvents(),
    });

    sections.push({
      label: `Events`,
      list: this.buildProgressiveList(),
    });

    return indexSectionLists(sections);
  }

  getRecentEvents() {
    let matched = this.matchingItems(this.state.recentEvents.slice(0, 3), renameEvent);
    matched.forEach(event => {
      event.section = `recent`;
    });
    return matched;
  }

  buildList() {
    return this.allMatchingEvents();
  }
});

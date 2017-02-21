import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import {
  extend,
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

    let index = 0;
    sections.forEach(section => {
      section.list.forEach(option => {
        option.index = index++;
      });
    });

    return sections;
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

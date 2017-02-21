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
        getEvents: () => this.buildProgressiveList(),
        getRecentEvents: () => this.getRecentEvents(),
      }),
    };
  }

  attachedCallback() {
    super.attachedCallback(...arguments);
    const eventList = [...this.getRecentEvents(), ...this.buildList()];
    this.app.updateBuilder({
      activeListItem: eventList.length ? eventList[0] : null,
      visibleListItems: eventList,
    });
  }

  detachedCallback() {
    this.app.updateBuilder({
      activeListItem: null,
      visibleListItems: [],
    });
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

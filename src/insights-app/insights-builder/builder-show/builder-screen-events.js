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
        getRecentEvents: () => this.matchingItems(this.state.recentEvents.slice(0, 3), renameEvent),
      }),
    };
  }

  attachedCallback() {
    super.attachedCallback(...arguments);
    const eventList = this.buildList();
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

  buildList() {
    return this.allMatchingEvents();
  }
});

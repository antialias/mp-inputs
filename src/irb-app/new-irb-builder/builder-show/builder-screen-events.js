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

  buildList() {
    this.updateScreensRenderedSize();
    return this.allMatchingEvents();
  }
});

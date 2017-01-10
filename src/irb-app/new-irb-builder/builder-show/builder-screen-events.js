import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { ShowClause } from '../../../models/clause';
import {
  extend,
  renameEvent,
  sorted,
} from '../../../util';

import template from './builder-screen-events.jade';

document.registerElement(`builder-screen-events`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getEvents: () => this.buildProgressiveList(),
        getRecentEvents: () => this.state.recentEvents.slice(0, 3),
        clickedEvent: value => {
          this.app.updateRecentEvents(value);
          this.updateAndCommitStageClause({value, property: null});
        },
        clickedEventProperties: (ev, value) => {
          ev.stopPropagation();
          this.updateStageClause({value}, {shouldCommit: true});
          this.app.updateBuilder({isContextualMenuOpen: false});
          this.app.update({stageClauseIndex: this.app.getClausesForType(ShowClause.TYPE).length - 1});
          this.nextScreen(`builder-screen-numeric-properties`);
        },
      }),
    };
  }

  buildList() {
    return [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS].concat(sorted(this.state.topEvents, {
      transform: mpEvent => renameEvent(mpEvent.name).toLowerCase(),
    }));
  }
});

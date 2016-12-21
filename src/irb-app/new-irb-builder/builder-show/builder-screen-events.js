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
        clickedEvent: value => {
          this.updateStageClause({value}, {shouldCommit: true, shouldStopEditing: true});
        },
        clickedEventProperties: (ev, value) => {
          ev.stopPropagation();
          this.updateStageClause({value}, {shouldCommit: true});
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

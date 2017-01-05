/* global JSON, localStorage */

import { BuilderScreenBase } from '../builder-pane/builder-screen-base';
import { ShowClause } from '../../../models/clause';
import {
  extend,
  renameEvent,
  sorted,
} from '../../../util';

import template from './builder-screen-events.jade';
import './builder-screen-events.styl';

const RECENT_EVENTS_LOCALSTORAGE_KEY = `mp_irb_recent_events`;

document.registerElement(`builder-screen-events`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getEvents: () => this.buildProgressiveList(),
        getRecentEvents: () => this.getRecentEvents(),
        clickedEvent: value => {
          this.updateRecentEvents(value);
          this.updateAndCommitStageClause({value});
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

  getRecentEvents() {
    return JSON.parse(localStorage.getItem(RECENT_EVENTS_LOCALSTORAGE_KEY) || `[]`);
  }

  updateRecentEvents(mpEvent) {
    let recentEvents = this.getRecentEvents();
    recentEvents = recentEvents.filter(recentEvent => recentEvent.name !== mpEvent.name);
    recentEvents = [mpEvent].concat(recentEvents);
    recentEvents = recentEvents.slice(0, 3);
    localStorage.setItem(RECENT_EVENTS_LOCALSTORAGE_KEY, JSON.stringify(recentEvents));
  }
});

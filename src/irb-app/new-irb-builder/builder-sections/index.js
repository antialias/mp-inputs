import { Component } from 'panel';

import { ShowClause } from '../../../models/clause';
import {
  extend,
  pick,
  renameEvent,
  sorted
} from '../../../util';

import template from './index.jade';
import eventsTemplate from './events-view.jade';
import sourcesTemplate from './sources-view.jade';

import './index.styl';


document.registerElement(`builder-view`, class extends Component {
  get config() {
    return {
      template,
    };
  }
});

class BuilderView extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    window.requestAnimationFrame(() => {
      this.app.setBoundariesAtViewIndex(this.viewIdx, this.getBoundingClientRect());
    });
  }

  get viewIdx() {
    return Number(this.getAttribute(`view-index`));
  }

  closeBuilder() {
    this.app.stopEditingClause();
  }

  previousBuilderView() {
    this.app.previousBuilderView();
  }

  updateStageClause(clauseAttrs, shouldCommit=false) {
    if (!this.state.builderPane.inTransition) {
      this.app.updateStageClause(clauseAttrs);
      if (shouldCommit) {
        this.app.commitStageClause();
      }
    }
  }

  nextBuilderView(view) {
    if (!this.state.builderPane.inTransition) {
      this.app.nextBuilderView(view);
    }
  }
}

document.registerElement(`builder-view-events`, class extends BuilderView {
  get config() {
    return {
      template: eventsTemplate,
      helpers: {
        clickedEvent: value => {
          this.updateStageClause({value}, true);
        },
        getEvents: () => {
          const topEvents = sorted(this.state.topEvents, {
            transform: ev => renameEvent(ev.name).toLowerCase(),
          }).map(ev => extend(ev, {icon: ev.custom ? `custom-events` : `event`}));
          const specialEvents = [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS].map(ev => extend(ev, {icon: `star`}));
          return specialEvents.concat(topEvents);
        },
      },
    };
  }
});

document.registerElement(`builder-view-sources`, class extends BuilderView {
  get config() {
    return {
      template: sourcesTemplate,
      helpers: {
        getSources: () => {
          return [
            {
              name: `Event`,
              resourceType: `events`,
            },
            {
              name: `People`,
              resourceType: `people`,
            },
          ];
        },
        clickedSource: source => {
          if (source.resourceType === `events`) {
            this.updateStageClause(pick(source, [`resourceType`]));
            this.nextBuilderView(`builder-view-${source.resourceType}`);
          }
        },
      },
    };
  }
});

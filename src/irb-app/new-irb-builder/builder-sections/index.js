import { Component } from 'panel';

import { ShowClause } from '../../../models/clause';
import { pick, renameEvent, sorted } from '../../../util';

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
}

document.registerElement(`builder-view-events`, class extends BuilderView {
  get config() {
    return {
      template: eventsTemplate,
      helpers: {
        clickedEvent: value => {
          this.app.updateStageClause({value});
          this.app.commitStageClause();
        },
        getEvents: () => {
          const topEvents = sorted(this.state.topEvents, {
            transform: ev => renameEvent(ev.name).toLowerCase(),
          });
          return [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS].concat(topEvents);
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
          // use something like ShowClause.RESOURCE_TYPES
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
            this.app.updateStageClause(pick(source, [`resourceType`]));
            this.app.nextBuilderView(source.resourceType);
          }
        },
      },
    };
  }
});

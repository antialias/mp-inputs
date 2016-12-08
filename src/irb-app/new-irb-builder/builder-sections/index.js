import { Component } from 'panel';

import { ShowClause } from '../../../models/clause';
import {
  extend,
  pick,
  renameEvent,
  sorted,
} from '../../../util';

import template from './index.jade';
import eventsTemplate from './events-view.jade';
import sourcesTemplate from './sources-view.jade';

import './index.styl';
import './mixin.styl';


document.registerElement(`builder-pane`, class extends Component {
  get config() {
    return {
      template,
    };
  }
});

class BuilderViewBase extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    window.requestAnimationFrame(this.updateViewSize.bind(this));
  }

  get config() {
    return {
      helpers: {
        closeBuilder: () => this.app.stopEditingClause(),
        previousBuilderView: () => {
          const views = this.state.builderPane.views.slice(0, -1);
          this.app.updateBuilderView({
            inTransition: true,
            offsetStyle: this.createBuilderOffsetStyle(views),
            sizeStyle: this.createBuilderSizeStyle(views),
          }, {views});
        },
      },
    };
  }

  createBuilderOffsetStyle(views) {
    const offset = views.slice(0, -1).reduce((sum, view) => sum + view.width || 0, 0);
    return {
      '-webkit-transform': `translateX(-${offset}px)`,
      transform: `translateX(-${offset}px)`,
    };
  }

  createBuilderSizeStyle(views) {
    const lastView = views[views.length - 1];
    return {
      width: `${lastView.width}px`,
      height: `${lastView.height}px`,
    };
  }

  nextBuilderView(view) {
    this.app.nextBuilderView(view);
  }

  setBuilderSizeAndPosition(width, height) {
    if (width && height) {
      const views = this.state.builderPane.views.slice();
      Object.assign(views[this.viewIdx], {width, height});

      this.app.updateBuilderView({
        offsetStyle: this.createBuilderOffsetStyle(views),
        sizeStyle: this.createBuilderSizeStyle(views),
        views,
      });
    }
  }

  updateStageClause(clauseAttrs, shouldCommit=false) {
    if (!this.state.builderPane.inTransition) {
      this.app.updateStageClause(clauseAttrs);
      if (shouldCommit) {
        this.app.commitStageClause();
      }
    }
  }

  updateViewSize() {
    const {width, height} = this.getBoundingClientRect();
    this.setBuilderSizeAndPosition(width, height);
  }

  get viewIdx() {
    return Number(this.getAttribute(`view-index`));
  }
}

document.registerElement(`builder-view-events`, class extends BuilderViewBase {
  get config() {
    return {
      template: eventsTemplate,
      helpers: extend({
        clickedEvent: value => {
          this.updateStageClause({value}, true);
        },
        getEvents: () => {
          const topEvents = sorted(this.state.topEvents, {
            transform: ev => renameEvent(ev.name).toLowerCase(),
          }).map(ev => extend(ev, {icon: ev.custom ? `custom-events` : `event`}));
          const specialEvents = [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS].map(ev => extend(ev, {icon: `star-top-events`}));
          return specialEvents.concat(topEvents);
        },
      }, super.config.helpers),
    };
  }
});

const SOURCES = [
  {
    name: `Event`,
    resourceType: `events`,
  },
  {
    name: `People`,
    resourceType: `people`,
  },
];

document.registerElement(`builder-view-sources`, class extends BuilderViewBase {
  get config() {
    return {
      template: sourcesTemplate,
      helpers: extend({
        getSources: () => SOURCES,
        clickedSource: source => {
          if (source.resourceType === `events`) {
            this.updateStageClause(pick(source, [`resourceType`]));
            this.nextBuilderView(`builder-view-${source.resourceType}`);
          }
        },
      }, super.config.helpers),
    };
  }
});

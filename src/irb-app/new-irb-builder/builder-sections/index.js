import { Component } from 'panel';

import { ShowClause } from '../../../models/clause';
import {
  extend,
  renameEvent,
  sorted,
} from '../../../util';

import template from './index.jade';
import eventsTemplate from './events-screen.jade';
import sourcesTemplate from './sources-screen.jade';

import './index.styl';


document.registerElement(`builder-pane`, class extends Component {
  get config() {
    return {
      template,
    };
  }
});

class BuilderScreenBase extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.updateScreensRenderedSize();
  }

  get config() {
    return {
      helpers: {
        closePane: () => this.app.stopEditingClause(),
        previousScreen: () => {
          const screens = this.state.builderPane.screens.slice(0, -1);
          this.app.updateBuilder({
            inTransition: true,
            offsetStyle: this.createPaneOffsetStyle(screens),
            sizeStyle: this.createPaneSizeStyle(screens),
          }, {screens});
        },
      },
    };
  }

  createPaneOffsetStyle(screens) {
    const offset = screens.slice(0, -1).reduce((sum, screen) => sum + (screen.width || 0), 0);
    return {
      '-webkit-transform': `translateX(-${offset}px)`,
      transform: `translateX(-${offset}px)`,
    };
  }

  createPaneSizeStyle(screens) {
    const lastScreen = screens[screens.length - 1];
    return {
      width: `${lastScreen.width}px`,
      height: `${lastScreen.height}px`,
    };
  }

  nextScreen(componentName) {
    if (!this.state.builderPane.inTransition) {
      this.app.updateBuilder({
        inTransition: true,
        screens: this.state.builderPane.screens.concat({componentName}),
      });
    }
  }

  setPaneSizeAndPosition(width, height) {
    if (width && height) {
      const screens = this.state.builderPane.screens;
      Object.assign(screens[this.screenIdx], {width, height});

      this.app.updateBuilder({
        offsetStyle: this.createPaneOffsetStyle(screens),
        sizeStyle: this.createPaneSizeStyle(screens),
        screens,
      });
    }
  }

  updateStageClause(clauseAttrs, options={shouldCommit: false}) {
    if (!this.state.builderPane.inTransition) {
      this.app.updateStageClause(clauseAttrs);
      if (options.shouldCommit) {
        this.app.commitStageClause();
      }
    }
  }

  updateScreensRenderedSize() {
    window.requestAnimationFrame(() => {
      const {width, height} = this.getBoundingClientRect();
      this.setPaneSizeAndPosition(width, height);
    });
  }

  get screenIdx() {
    return Number(this.getAttribute(`screen-index`));
  }
}

document.registerElement(`builder-screen-events`, class extends BuilderScreenBase {
  get config() {
    return {
      template: eventsTemplate,
      helpers: extend(super.config.helpers, {
        clickedEvent: value => {
          this.updateStageClause({value}, {shouldCommit: true});
        },
        getEvents: () => {
          const topEvents = sorted(this.state.topEvents, {
            transform: ev => renameEvent(ev.name).toLowerCase(),
          }).map(ev => extend(ev, {icon: ev.custom ? `custom-events` : `event`}));
          const specialEvents = [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS].map(ev => extend(ev, {icon: `star-top-events`}));
          return specialEvents.concat(topEvents);
        },
      }),
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

document.registerElement(`builder-screen-sources`, class extends BuilderScreenBase {
  get config() {
    return {
      template: sourcesTemplate,
      helpers: extend(super.config.helpers, {
        clickedSource: source => {
          const {resourceType} = source;
          if (resourceType === `events`) {
            this.updateStageClause({resourceType});
            this.nextScreen(`builder-screen-${resourceType}`);
          }
        },
        SOURCES,
      }),
    };
  }
});

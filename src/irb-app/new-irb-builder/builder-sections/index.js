import { Component } from 'panel';

import { ShowClause } from '../../../models/clause';
import {
  extend,
  replaceByIndex,
  renameEvent,
  renameProperty,
  sorted,
} from '../../../util';

import template from './index.jade';
import eventsTemplate from './events-screen.jade';
import sourcesTemplate from './sources-screen.jade';
import propertiesTemplate from './properties-screen.jade';

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
        screenIdx: () => this.screenIdx,
        closePane: () => this.app.stopEditingClause(),
        clickedBackButton: () => this.previousScreen(),
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

  previousScreen() {
    const screens = this.state.builderPane.screens.slice(0, -1);
    this.app.updateBuilder({
      inTransition: true,
      offsetStyle: this.createPaneOffsetStyle(screens),
      sizeStyle: this.createPaneSizeStyle(screens),
    }, {screens});
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
      let screens = this.app.state.builderPane.screens;
      let screen = screens[this.screenIdx];

      if (screen) {
        screen = extend(screen, {width, height});
        screens = replaceByIndex(screens, this.screenIdx, screen);

        this.app.updateBuilder({
          offsetStyle: this.createPaneOffsetStyle(screens),
          sizeStyle: this.createPaneSizeStyle(screens),
          screens,
        });
      }
    }
  }

  updateStageClause(clauseAttrs, {shouldCommit=false, shouldStopEditing=false}={}) {
    if (!this.state.builderPane.inTransition) {
      this.app.updateStageClause(clauseAttrs);
      if (shouldCommit) {
        this.app.commitStageClause({shouldStopEditing});
      }
    }
  }

  updateScreensRenderedSize({cancelDuringTransition=false}={}) {
    window.requestAnimationFrame(() => {
      if (!(cancelDuringTransition && this.state.builderPane.inTransition)) {
        const {width, height} = this.firstChild.getBoundingClientRect();
        this.setPaneSizeAndPosition(width, height);
      }
    });
  }

  get screenIdx() {
    return Number(this.getAttribute(`screen-index`));
  }
}

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
        SOURCES,
        clickedSource: source => {
          const {resourceType} = source;
          if (resourceType === `events`) {
            this.updateStageClause({resourceType});
            this.nextScreen(`builder-screen-${resourceType}`);
          }
        },
      }),
    };
  }
});

document.registerElement(`builder-screen-events`, class extends BuilderScreenBase {
  get config() {
    return {
      template: eventsTemplate,
      helpers: extend(super.config.helpers, {
        getEvents: () => {
          const topEvents = sorted(this.state.topEvents, {
            transform: ev => renameEvent(ev.name).toLowerCase(),
          }).map(ev => extend(ev, {icon: ev.custom ? `custom-events` : `event`}));
          const specialEvents = [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS].map(ev => extend(ev, {icon: `star-top-events`}));
          return specialEvents.concat(topEvents);
        },
        clickedEvent: value => {
          this.updateStageClause({value}, {shouldCommit: true, shouldStopEditing: true});
        },
        clickedEventProperties: (ev, value) => {
          ev.stopPropagation();
          this.updateStageClause({value}, {shouldCommit: true});
          this.nextScreen(`builder-screen-properties`);
        },
      }),
    };
  }
});

document.registerElement(`builder-screen-properties`, class extends BuilderScreenBase {
  get config() {
    return {
      template: propertiesTemplate,
      helpers: extend(super.config.helpers, {
        getProperties: () => {
          const stageClause = this.app.activeStageClause;
          const mpEvent = stageClause && stageClause.value && stageClause.value.name;
          let topProperties = this.state.topEventPropertiesByEvent[mpEvent];
          let updateBuilderSize = false;

          if (!topProperties) {
            topProperties = [];

            if (mpEvent === ShowClause.TOP_EVENTS.name || mpEvent === ShowClause.ALL_EVENTS.name) {
              topProperties = this.state.topEventProperties;
            } else if (mpEvent) {
              this.app.getTopPropertiesForEvent(mpEvent);
              this.loading = true;
            }
          } else if (this.loading) {
            this.loading = false;
            updateBuilderSize = true;
          }

          topProperties = sorted(topProperties, {
            transform: prop => renameProperty(prop.name).toLowerCase(),
          });

          if (!this.showingNonNumericProperties) {
            topProperties = topProperties.filter(prop => prop.type === `number`);
          }

          if (this.numProperties !== topProperties.length) {
            this.numProperties = topProperties.length;
            updateBuilderSize = true;
          }

          if (updateBuilderSize) {
            this.updateScreensRenderedSize({
              cancelDuringTransition: true,
            });
          }

          return topProperties;
        },
        clickedProperty: property => {
          this.updateStageClause({property}, {shouldCommit: true, shouldStopEditing: true});
        },
        toggleNonNumericProperties: () =>
          this.app.updateBuilderCurrentScreen({
            showingNonNumericProperties: !this.showingNonNumericProperties,
          }),
      }),
    };
  }

  get showingNonNumericProperties() {
    const screen = this.app.getBuilderCurrentScreen();
    return screen && !!screen.showingNonNumericProperties;
  }
});


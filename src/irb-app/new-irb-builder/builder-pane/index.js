/* global requestAnimationFrame */

import { Component } from 'panel';

import { Clause, ShowClause } from '../../../models/clause';
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
import groupPropertiesTemplate from './group-properties-screen.jade';
import numericPropertiesTemplate from './numeric-properties-screen.jade';

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
        clickedBackButton: () => this.previousScreen(),
        closePane: () => this.app.stopEditingClause(),
        screenIdx: () => this.screenIdx,
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
    requestAnimationFrame(() => {
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
          this.nextScreen(`builder-screen-numeric-properties`);
        },
      }),
    };
  }
});

class BuilderScreenProperties extends BuilderScreenBase {
  get config() {
    return {
      helpers: extend(super.config.helpers, {
        getProperties: () => {
          const properties = this.properties;

          if (this.numProperties !== (properties && properties.length)) {
            this.numProperties = properties.length;
            this.updateScreensRenderedSize({
              cancelDuringTransition: true,
            });
          }

          return properties || [];
        },
      }),
    };
  }

  get properties() {
    throw `Not implemented!`;
  }

  get loading() {
    throw `Not implemented!`;
  }

  updateStageClause(update) {
    super.updateStageClause(update, {
      shouldCommit: true,
      shouldStopEditing: true,
    });
  }
}

document.registerElement(`builder-screen-numeric-properties`, class extends BuilderScreenProperties {
  get config() {
    return {
      template: numericPropertiesTemplate,
      helpers: extend(super.config.helpers, {
        toggleNonNumericProperties: () => this.app.updateBuilderCurrentScreen({
          showingNonNumericProperties: !this.isShowingNonNumericProperties(),
        }),
        clickedProperty: property => this.updateStageClause({property}),
      }),
    };
  }

  get event() {
    const stageClause = this.app.activeStageClause;
    return stageClause && stageClause.value && stageClause.value.name;
  }

  get properties() {
    let properties = this.state.topEventPropertiesByEvent[this.event];

    if (!properties) {
      if (this.event === ShowClause.TOP_EVENTS.name || this.event === ShowClause.ALL_EVENTS.name) {
        properties = this.state.topEventProperties;
      } else if (this.event) {
        this.app.getTopPropertiesForEvent(this.event);
      }
    }

    if (properties) {
      properties = sorted(properties, {
        transform: prop => renameProperty(prop.name).toLowerCase(),
      });

      if (!this.isShowingNonNumericProperties()) {
        properties = properties.filter(prop => prop.type === `number`);
      }
    }

    return properties;
  }

  get loading() {
    return !this.state.topEventPropertiesByEvent.hasOwnProperty(this.event);
  }

  isShowingNonNumericProperties() {
    const screen = this.app.getBuilderCurrentScreen();
    return screen && !!screen.showingNonNumericProperties;
  }
});

document.registerElement(`builder-screen-group-properties`, class extends BuilderScreenProperties {
  get config() {
    return {
      template: groupPropertiesTemplate,
      helpers: extend(super.config.helpers, {
        RESOURCE_TYPES: Clause.RESOURCE_TYPES,
        selectResourceType: resourceType => this.app.updateBuilderCurrentScreen({resourceType}),
        clickedProperty: property => this.updateStageClause({resourceType: property.resourceType, value: property.name}),
      }),
    };
  }

  get resourceType() {
    const screen = this.app.getBuilderCurrentScreen();
    return (screen && screen.resourceType) || Clause.RESOURCE_TYPE_ALL;
  }

  get properties() {
    switch (this.resourceType) {
      case Clause.RESOURCE_TYPE_ALL:
        return this.state.topEventProperties.concat(this.state.topPeopleProperties);
      case Clause.RESOURCE_TYPE_EVENTS:
        return this.state.topEventProperties;
      case Clause.RESOURCE_TYPE_PEOPLE:
        return this.state.topPeopleProperties;
    }
  }

  get loading() {
    switch (this.resourceType) {
      case Clause.RESOURCE_TYPE_ALL:
        return !(this.state.topEventProperties.length || this.state.topPeopleProperties.length);
      case Clause.RESOURCE_TYPE_EVENTS:
        return !this.state.topEventProperties.length;
      case Clause.RESOURCE_TYPE_PEOPLE:
        return !this.state.topPeopleProperties.length;
    }
  }
});

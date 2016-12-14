/* global requestAnimationFrame */

import { Component } from 'panel';

import { Clause, GroupClause, ShowClause } from '../../../models/clause';
import {
  extend,
  renameEvent,
  replaceByIndex,
  sorted,
} from '../../../util';

import template from './index.jade';
import contextualTemplate from './contextual-screen.jade';
import eventsTemplate from './events-screen.jade';
import groupPropertiesTemplate from './group-properties-screen.jade';
import numericPropertiesTemplate from './numeric-properties-screen.jade';
import sourcesTemplate from './sources-screen.jade';

import './index.styl';

document.registerElement(`builder-pane`, class extends Component {
  get config() {
    return {
      template,
    };
  }
});

const PROGRESSIVE_LIST_BUFFER_PX = 50;
const PROGRESSIVE_LIST_START_SIZE = 20;

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
        scrolledList: ev => {
          const scrollBottom = ev.target.scrollTop + ev.target.offsetHeight;
          if (scrollBottom + PROGRESSIVE_LIST_BUFFER_PX >= ev.target.scrollHeight) {
            this.increaseProgressiveListSize();
          }
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
        this.app.stopBuildingQuery();
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

  get progressiveListSize() {
    const screen = this.app.getBuilderCurrentScreen();
    return (screen && screen.progressiveListSize) || PROGRESSIVE_LIST_START_SIZE;
  }

  increaseProgressiveListSize() {
    if (this.progressiveListSize < this.buildList().length) {
      const progressiveListSize = this.progressiveListSize * 2;
      this.app.updateBuilderCurrentScreen({progressiveListSize});
    }
  }

  buildProgressiveList() {
    return this.buildList().slice(0, this.progressiveListSize);
  }
}

const SOURCES = [
  {name: `Event`, resourceType: `events`},
  {name: `People`, resourceType: `people`},
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

const CONTEXTUAL_OPTIONS = {
  events: [
    {name: `Group by a property`, clauseType: `group`},
    {name: `Compare to an event`, clauseType: `show`},
  ],
};

document.registerElement(`builder-screen-contextual`, class extends BuilderScreenBase {
  get config() {
    return {
      template: contextualTemplate,
      helpers: extend(super.config.helpers, {
        clickedOption: option => {
          switch (option.clauseType) {
            case ShowClause.TYPE:
              this.app.stopEditingClause();
              this.app.startAddingClause(option.clauseType);
              this.nextScreen(`builder-screen-events`);
              break;
            case GroupClause.TYPE:
              this.app.stopEditingClause();
              this.app.startAddingClause(option.clauseType);
              this.nextScreen(`builder-screen-group-properties`);
              break;
          }
        },
        getContextOptions: () => {
          const firstShowClause = this.state.report.sections.show.clauses[0];
          let options = [];
          switch (firstShowClause.resourceType) {
            case `all`:
            case `events`:
              options = CONTEXTUAL_OPTIONS[`events`];
          }
          return options;
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

class BuilderScreenProperties extends BuilderScreenBase {
  get config() {
    return {
      helpers: extend(super.config.helpers, {
        getProperties: () => {
          const properties = this.buildProgressiveList();
          const isLoading = this.isLoading();

          if (this.prevIsLoading !== isLoading ||
              this.numProperties !== properties.length
          ) {
            this.prevIsLoading = isLoading;
            this.numProperties = properties.length;
            this.updateScreensRenderedSize({
              cancelDuringTransition: true,
            });
          }

          return properties;
        },
      }),
    };
  }

  isLoading() {
    throw `Not implemented!`;
  }

  buildList() {
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

  isLoading() {
    return !this.state.topEventPropertiesByEvent.hasOwnProperty(this.event);
  }

  get event() {
    const stageClause = this.app.activeStageClause;
    return stageClause && stageClause.value && stageClause.value.name;
  }

  buildList() {
    let properties = this.state.topEventPropertiesByEvent[this.event];

    if (!properties) {
      if (this.event === ShowClause.TOP_EVENTS.name || this.event === ShowClause.ALL_EVENTS.name) {
        properties = this.state.topEventProperties;
      } else if (this.event) {
        this.app.fetchTopPropertiesForEvent(this.event);
      }
    }

    if (!this.isShowingNonNumericProperties()) {
      properties = properties && properties.filter(prop => prop.type === `number`);
    }

    return properties || [];
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

  isLoading() {
    return !!{
      [Clause.RESOURCE_TYPE_ALL]: !(this.state.topEventProperties.length || this.state.topPeopleProperties.length),
      [Clause.RESOURCE_TYPE_EVENTS]: !this.state.topEventProperties.length,
      [Clause.RESOURCE_TYPE_PEOPLE]: !this.state.topPeopleProperties.length,
    }[this.getResourceType()];
  }

  getResourceType() {
    const screen = this.app.getBuilderCurrentScreen();
    return (screen && screen.resourceType) || Clause.RESOURCE_TYPE_ALL;
  }

  buildList() {
    return {
      [Clause.RESOURCE_TYPE_ALL]: this.state.topEventProperties.concat(this.state.topPeopleProperties),
      [Clause.RESOURCE_TYPE_EVENTS]: this.state.topEventProperties,
      [Clause.RESOURCE_TYPE_PEOPLE]: this.state.topPeopleProperties,
    }[this.getResourceType()] || [];
  }
});

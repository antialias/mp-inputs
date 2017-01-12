import { Component } from 'panel';

import { Clause, ShowClause } from '../../../models/clause';
import BaseQuery from '../../../models/queries/base';
import {
  extend,
  renameEvent,
  renameProperty,
  replaceByIndex,
  sorted,
  stringFilterMatches,
} from '../../../util';

const PROGRESSIVE_LIST_BUFFER_PX = 50;
const PROGRESSIVE_LIST_START_SIZE = 20;

export class BuilderScreenBase extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.updateScreensRenderedSize();
  }

  get config() {
    return {
      helpers: {
        clickedEvent: value => {
          this.app.updateRecentEvents(value);
          this.updateAndCommitStageClause({value, property: null});
        },
        clickedEventProperties: (ev, value) => {
          ev.stopPropagation();
          this.updateStageClause({value, property: null}, {shouldCommit: true});
          this.app.updateBuilder({isContextualMenuOpen: false});
          this.app.update({stageClauseIndex: this.app.getClausesForType(ShowClause.TYPE).length - 1});
          this.nextScreen(`builder-screen-numeric-properties`);
        },
        clickedProperty: (ev, property) => this.updateAndCommitStageClause({
          property,
          value: ShowClause.ALL_PEOPLE,
        }),

        clickedBackButton: () => this.previousScreen(),
        closePane: () => this.app.stopEditingClause(),
        screenIdx: () => this.screenIdx,
        scrolledList: ev => {
          const scrollBottom = ev.target.scrollTop + ev.target.offsetHeight;
          if (scrollBottom + PROGRESSIVE_LIST_BUFFER_PX >= ev.target.scrollHeight) {
            this.increaseProgressiveListSize();
          }
        },
        getStageClauseAttr: attr =>
          this.app.activeStageClause && this.app.activeStageClause[attr],
        isLoading: () => this.isLoading(),
      },
    };
  }

  isLoading() {
    throw new Error(`Not implemented!`);
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
      'min-height': `${lastScreen.height}px`,
    };
  }

  /**
   * filter item list against contextFilter, and add match
   * data to every matching item (for highlighting)
   */
  matchingItems(items, renameFunc) {
    if (this.state.contextFilter) {
      items = items
        .map(item => extend(item, {
          matches: stringFilterMatches(renameFunc(item.name), this.state.contextFilter),
        }))
        .filter(item => !!item.matches);
    }
    return items;
  }

  allMatchingEvents() {
    const mpEvents = this.state.topEvents === BaseQuery.LOADING ? [] : this.state.topEvents;
    return [
      ...this.matchingItems([
        ShowClause.TOP_EVENTS,
        ShowClause.ALL_EVENTS,
      ], renameEvent),
      ...sorted(this.matchingItems(mpEvents, renameEvent), {
        transform: mpEvent => renameEvent(mpEvent.name).toLowerCase(),
      }),
    ];
  }

  allMatchingProperties(propType) {
    const isPeople = propType === Clause.RESOURCE_TYPE_PEOPLE;
    let properties = isPeople ? this.state.topPeopleProperties : this.state.topEventProperties;
    properties = properties === BaseQuery.LOADING ? [] : properties;

    return sorted(this.matchingItems(properties, renameProperty), {
      transform: prop => renameProperty(prop.name).toLowerCase(),
    });
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

  updateScreensRenderedSize({cancelDuringTransition=false}={}) {
    requestAnimationFrame(() => {
      if (!(cancelDuringTransition && this.state.builderPane.inTransition)) {
        const {width, height} = this.firstChild.getBoundingClientRect();
        this.setPaneSizeAndPosition(width, height);
      }
    });
  }

  updateStageClause(clauseAttrs, {shouldCommit=false, shouldStopEditing=false}={}) {
    if (!this.state.builderPane.inTransition) {
      this.app.updateStageClause(clauseAttrs);
      if (shouldCommit) {
        this.app.commitStageClause({shouldStopEditing});
      }
    }
  }

  updateAndCommitStageClause(clauseAttrs) {
    this.updateStageClause(clauseAttrs, {
      shouldCommit: true,
      shouldStopEditing: true,
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

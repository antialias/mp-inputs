import {Component} from 'panel';
import throttle from 'lodash/throttle';
import {
  defaultOrdering,
  lexicalCompose,
  mapArguments,
} from 'mixpanel-common/util/function';

import {Clause, GroupClause, ShowClause} from '../../../models/clause';
import BaseQuery from '../../../models/queries/base';
import {
  extend,
  getIconForEvent,
  getIconForPropertyType,
  renameEvent,
  renameProperty,
  replaceByIndex,
  sorted,
  stringFilterMatches,
} from '../../../util';

const IDENTITY_FUNC = x => x;

const PROGRESSIVE_LIST_BUFFER_PX = 250;
const PROGRESSIVE_LIST_START_SIZE = 20;

export class BuilderScreenBase extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.updateRenderedSizeOnNextFrame({cancelDuringTransition: false});
  }

  get config() {
    return {
      helpers: {
        clickedEvent: ev => {
          const value = ev.detail.item;
          this.app.updateRecentEvents(value);
          this.updateAndCommitStageClause({value, property: null});
        },
        clickedEventProperties: ev => {
          ev.stopPropagation();
          const value = ev.detail.item;
          const isInContextualMenu = !!this.state.builderPane.isContextualMenuOpen;
          this.updateStageClause({value, property: null}, {shouldCommit: !isInContextualMenu});
          this.nextScreen(`builder-screen-numeric-properties`, {
            previousScreens: [`builder-screen-sources`],
          });
        },
        clickedProperty: ev => {
          const property = ev.detail.item;
          const clauseAttrs = {
            property,
            value: ShowClause.ALL_PEOPLE,
          };
          if (property.name === ShowClause.ALL_PEOPLE.name) {
            clauseAttrs.resourceType = Clause.RESOURCE_TYPE_PEOPLE;
            clauseAttrs.property = null;
          }
          this.updateAndCommitStageClause(clauseAttrs);
        },

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
        getUpsellOptions: (resource, hasResource) => this.app.upsellTextOptions(resource, hasResource),
        getUtcOffset: () => this.app.getUtcOffset(),
        isLoading: () => this.isLoading(),
        updateRenderedSize: throttle(() => this.updateRenderedSize(), 200, {leading: true}),
        updateActiveIndex: index => this.app.setActiveIndex(index, {scrollIntoView: false}),
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
      height: `${lastScreen.height}px`,
    };
  }

  /**
   * filter item list against contextFilter, and add match
   * data to every matching item (for highlighting)
   */
  matchingItems(items, renameFunc=IDENTITY_FUNC) {
    if (this.state.contextFilter) {
      items = items
        .map(item => extend(item, {
          matches: stringFilterMatches(renameFunc(item.name), this.state.contextFilter),
        }))
        .filter(item => !!item.matches)
        .sort(lexicalCompose(
          // prioritize beginning match
          mapArguments(defaultOrdering, item => -item.matches[0].length),

          // second: a-z
          mapArguments(defaultOrdering, item => renameFunc(item.name).toLowerCase())
        ));
    }
    return items;
  }

  allEvents() {
    const mpEvents = this.app.getTopEvents() === BaseQuery.LOADING ? [] : this.app.getTopEvents();
    return [
      ShowClause.TOP_EVENTS,
      ShowClause.ALL_EVENTS,
      ...sorted(mpEvents.map(event => extend({
        label: renameEvent(event.name),
        icon: getIconForEvent(event),
      }, event)), {transform: event => event.label.toLowerCase()}),
    ];
  }

  allProperties(propType) {
    const isPeople = propType === Clause.RESOURCE_TYPE_PEOPLE;
    let properties = isPeople ? this.app.getTopPeopleProperties() : this.app.getTopEventProperties();
    properties = properties === BaseQuery.LOADING ? [] : properties;
    // TODO: ShowClause.ALL_PEOPLE should  only be show for show clause
    let specialProps = [ShowClause.ALL_PEOPLE];
    if (!isPeople) {
      specialProps = specialProps.concat(GroupClause.EVENT_DATE);
    }

    return [
      ...specialProps,
      ...sorted(properties.map(property => extend({
        label: renameProperty(property.name),
        icon: getIconForPropertyType(property.type),
      }, property)), {transform: property => property.label.toLowerCase()}),
    ];
  }

  // find input associated with this dropdown and focus it
  focusInput() {
    requestAnimationFrame(() => {
      let el;
      for (
        el = this.parentNode;
        el && el.classList && !el.classList.contains(`pane-open`) && el.nodeName.toLowerCase() !== `builder-pane`;
        el = el.parentNode
      );

      const input = el.querySelector(`resize-input,input.control-label,.date-input input`);
      if (input) {
        // a short timeout allows animation to complete smoothly - not a long-term solution but
        // requestAnimationFrame does not produce desired behavior
        setTimeout(() => input.focus(), 250);
      }
    });
  }

  previousScreen() {
    const screens = this.state.builderPane.screens.slice(0, -1);
    this.app.updateBuilder({
      inTransition: true,
      offsetStyle: this.createPaneOffsetStyle(screens),
      sizeStyle: this.createPaneSizeStyle(screens),
    }, {screens});
    this.focusInput();
  }

  nextScreen(componentName, {previousScreens=[], screenAttrs={}}={}) {
    if (!this.state.builderPane.inTransition) {
      const builderScreens = this.state.builderPane.screens;
      const currScreen = extend({componentName}, screenAttrs);
      const prevScreens = previousScreens.map(componentName => ({componentName}));

      // If prevScreen is last screen in builderScreen then don't add it
      if (
        builderScreens.length > 0 && prevScreens.length > 0 &&
        builderScreens[builderScreens.length - 1].componentName === prevScreens[0].componentName
      ) {
        prevScreens.shift();
      }

      const screens = [...this.state.builderPane.screens, ...prevScreens, currScreen];
      this.app.update({contextFilter: ``});
      this.app.updateBuilder({
        activeIndex: 0,
        inTransition: true,
        screens,
      });
      this.focusInput();
    }
  }

  setPaneSizeAndPosition(width, height) {
    if (width || height) {
      let screens = this.app.state.builderPane.screens;
      let screen = screens[this.screenIdx];

      if (screen && (screen.width !== width || screen.height !== height)) {
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

  updateRenderedSize({cancelDuringTransition=true}={}) {
    if (!(cancelDuringTransition && this.state.builderPane.inTransition) && this.firstChild) {
      const {width, height} = this.firstChild.getBoundingClientRect();
      this.setPaneSizeAndPosition(width, height);
    }
  }

  updateRenderedSizeOnNextFrame({cancelDuringTransition=true}={}) {
    requestAnimationFrame(() => {
      this.updateRenderedSize({cancelDuringTransition});
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
    return this.app.getBuilderCurrentScreenAttr(`progressiveListSize`) || PROGRESSIVE_LIST_START_SIZE;
  }

  increaseProgressiveListSize() {
    if (this.progressiveListSize < this.progressiveListLength()) {
      const progressiveListSize = this.progressiveListSize * 2;
      this.app.updateBuilderCurrentScreen({progressiveListSize});
    }
  }

  buildProgressiveList() {
    return this.buildList().slice(0, this.progressiveListSize);
  }

  progressiveListLength() {
    return this.buildList().length;
  }

  resetProgressiveList() {
    this.app.updateBuilderCurrentScreen({progressiveListSize: null});
  }
}

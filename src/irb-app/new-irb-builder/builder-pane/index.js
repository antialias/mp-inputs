/* global requestAnimationFrame */

import { Component } from 'panel';

import { Clause, ShowClause } from '../../../models/clause';
import {
  extend,
  renameEvent,
  sorted,
} from '../../../util';

import { BuilderScreenBase } from './builder-screen-base';
import './builder-screen-contextual';

import template from './index.jade';
import eventsTemplate from './events-screen.jade';
import sourcesTemplate from './sources-screen.jade';
import mathTemplate from './math-screen.jade';

import './index.styl';

document.registerElement(`builder-pane`, class extends Component {
  get config() {
    return {
      helpers: {
        getSizeStyle: () => this.state.builderPane && this.state.builderPane.sizeStyle || this.app.defaultBuilderState.sizeStyle,
      },
      template,
    };
  }
});

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

export class BuilderScreenProperties extends BuilderScreenBase {
  get config() {
    return {
      helpers: extend(super.config.helpers, {
        RESOURCE_TYPES: Clause.RESOURCE_TYPES,
        formatResourceType: type => type === `events` ? `event` : type,
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
        selectResourceType: resourceType => this.app.updateBuilderCurrentScreen({resourceType}),
      }),
    };
  }

  getResourceType() {
    const screen = this.app.getBuilderCurrentScreen();
    return (screen && screen.resourceType) || Clause.RESOURCE_TYPE_ALL;
  }

  isLoading() {
    return !!{
      [Clause.RESOURCE_TYPE_ALL]: !(this.state.topEventProperties.length || this.state.topPeopleProperties.length),
      [Clause.RESOURCE_TYPE_EVENTS]: !this.state.topEventProperties.length,
      [Clause.RESOURCE_TYPE_PEOPLE]: !this.state.topPeopleProperties.length,
    }[this.getResourceType()];
  }

  buildList() {
    return {
      [Clause.RESOURCE_TYPE_ALL]: this.state.topEventProperties.concat(this.state.topPeopleProperties),
      [Clause.RESOURCE_TYPE_EVENTS]: this.state.topEventProperties,
      [Clause.RESOURCE_TYPE_PEOPLE]: this.state.topPeopleProperties,
    }[this.getResourceType()] || [];
  }
}

document.registerElement(`builder-screen-event-operator`, class extends BuilderScreenBase {
  get config() {
    return {
      template: mathTemplate,
      helpers: extend(super.config.helpers, {
        MATH_TYPES: ShowClause.MATH_TYPES,
        mathTypeClicked: clauseData => {
          this.app.updateClause(`show`, this.state.activeMathMenuIndex, clauseData);
          this.app.stopEditingClause();
        },
      }),
    };
  }
});

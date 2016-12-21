/* global requestAnimationFrame */

import { Component } from 'panel';

import { Clause } from '../../../models/clause';
import { extend } from '../../../util';

import { BuilderScreenBase } from './builder-screen-base';
import './builder-screen-contextual';
import './builder-screen-sources';

import template from './index.jade';

import './index.styl';

document.registerElement(`builder-pane`, class extends Component {
  get config() {
    return {
      template,

      helpers: {
        getSizeStyle: () => this.state.builderPane && this.state.builderPane.sizeStyle || this.app.defaultBuilderState.sizeStyle,
      },
    };
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

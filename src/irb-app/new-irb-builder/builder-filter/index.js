// "Filter" controls

import { Component } from 'panel';

import { BuilderScreenProperties } from '../builder-pane';
import { AddControl, EditControl } from '../controls';
import { extend } from '../../../util';

import template from './index.jade';
import filterPropertiesTemplate from './builder-screen-filter-properties.jade';

import './index.styl';

document.registerElement(`query-builder-filter`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
      },
    };
  }
});

// controls
document.registerElement(`builder-filter-add-control`, class extends AddControl {
  get section() {
    return `filter`;
  }

  get label() {
    return `Filter`;
  }

  openPane() {
    super.openPane();
    this.app.startBuilderOnScreen(`builder-screen-filter-properties`);
  }
});

document.registerElement(`builder-filter-edit-control`, class extends EditControl {
  get section() {
    return `filter`;
  }

  get label() {
    return `TODO`;
  }

  openPane() {
    super.openPane();
    this.app.startBuilderOnScreen(`builder-screen-filter-properties`);
  }
});

document.registerElement(`builder-screen-filter-properties`, class extends BuilderScreenProperties {
  get config() {
    return {
      template: filterPropertiesTemplate,
      helpers: extend(super.config.helpers, {
        isLoading: () => !this.properties.length,

        // RESOURCE_TYPES: Clause.RESOURCE_TYPES,
        // selectResourceType: resourceType => this.app.updateBuilderCurrentScreen({resourceType}),
        // clickedProperty: property => this.updateStageClause({resourceType: property.resourceType, value: property.name}),
      }),
    };
  }

  // get resourceType() {
  //   const screen = this.app.getBuilderCurrentScreen();
  //   return (screen && screen.resourceType) || Clause.RESOURCE_TYPE_ALL;
  // }

  get properties() {
    return this.state.topEventProperties.concat(this.state.topPeopleProperties);
  }
});

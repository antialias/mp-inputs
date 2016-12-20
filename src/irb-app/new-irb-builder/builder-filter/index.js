// "Filter" controls

import { Component } from 'panel';

import { BuilderScreenProperties } from '../builder-pane';
import { EditControl } from '../controls';
import { FilterClause } from '../../../models/clause';
import { extend } from '../../../util';

import template from './index.jade';
import filterAddTemplate from './builder-filter-add-control.jade';
import filterPropertiesTemplate from './builder-screen-filter-properties-list.jade';

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
document.registerElement(`builder-filter-add-control`, class extends Component {
  get config() {
    return {
      helpers: {
        clickedAdd: () => {
          if (!this.isPaneOpen()) {
            this.openPane();
          } else {
            this.app.stopBuildingQuery(this.tagName);
          }
        },
        isPaneOpen: () => this.isPaneOpen(),
      },
      template: filterAddTemplate,
    };
  }

  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, `stopBuildingQuery`);
  }

  isPaneOpen() {
    return !!this.state.builderPane.screens.length
      && this.app.isAddingClause(FilterClause.TYPE)
      && this.state.activeMathMenuIndex === null;
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-filter-properties-list`);
    this.app.startAddingClause(FilterClause.TYPE);
  }
});

document.registerElement(`builder-filter-edit-control`, class extends EditControl {
  get section() {
    return FilterClause.TYPE;
  }

  get label() {
    return `TODO`;
  }

  openPane() {
    super.openPane();
    this.app.startBuilderOnScreen(`builder-screen-filter-properties-list`);
  }
});

document.registerElement(`builder-screen-filter-properties-list`, class extends BuilderScreenProperties {
  get config() {
    return {
      template: filterPropertiesTemplate,
      helpers: extend(super.config.helpers, {
        clickedProperty: (ev, property) => {
          ev.stopPropagation();
          // this.updateStageClause({value}, {shouldCommit: true});
          this.updateStageClause({
            filterType: property.type,
            resourceType: property.resourceType,
            value: property.name,
          });
          this.nextScreen(`builder-screen-filter-property`);
        },

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

  buildList() {
    return this.properties;
  }

  isLoading() {
    return !this.properties.length;
  }
});

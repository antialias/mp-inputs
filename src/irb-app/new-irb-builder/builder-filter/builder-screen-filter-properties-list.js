import { BuilderScreenProperties } from '../builder-pane';
import { extend } from '../../../util';

import template from './builder-screen-filter-properties-list.jade';

document.registerElement(`builder-screen-filter-properties-list`, class extends BuilderScreenProperties {
  get config() {
    return {
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
      template,
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

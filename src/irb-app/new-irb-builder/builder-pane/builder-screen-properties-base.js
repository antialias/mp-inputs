import { BuilderScreenBase } from './builder-screen-base';
import { Clause } from '../../../models/clause';
import { extend } from '../../../util';

export class BuilderScreenPropertiesBase extends BuilderScreenBase {
  get config() {
    return {
      helpers: extend(super.config.helpers, {
        RESOURCE_TYPES: Clause.RESOURCE_TYPES,
        clickedResourceType: resourceType => this.app.updateBuilderCurrentScreen({resourceType}),
        getSelectedResourceType: () => this.getSelectedResourceType(),
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
        getRecentProperties: () => {
          const resourceType = this.getSelectedResourceType();
          return this.state.recentProperties
            .filter(property => resourceType === Clause.RESOURCE_TYPE_ALL || property.resourceType === resourceType)
            .slice(0, 3);
        },
      }),
    };
  }

  getSelectedResourceType() {
    const screen = this.app.getBuilderCurrentScreen();
    return (screen && screen.resourceType) || Clause.RESOURCE_TYPE_ALL;
  }

  isLoading() {
    return !!{
      [Clause.RESOURCE_TYPE_ALL]: !(this.state.topEventProperties.length || this.state.topPeopleProperties.length),
      [Clause.RESOURCE_TYPE_EVENTS]: !this.state.topEventProperties.length,
      [Clause.RESOURCE_TYPE_PEOPLE]: !this.state.topPeopleProperties.length,
    }[this.getSelectedResourceType()];
  }

  buildList() {
    return {
      [Clause.RESOURCE_TYPE_ALL]: this.state.topEventProperties.concat(this.state.topPeopleProperties),
      [Clause.RESOURCE_TYPE_EVENTS]: this.state.topEventProperties,
      [Clause.RESOURCE_TYPE_PEOPLE]: this.state.topPeopleProperties,
    }[this.getSelectedResourceType()] || [];
  }
}

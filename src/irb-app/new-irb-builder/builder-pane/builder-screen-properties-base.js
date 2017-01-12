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

  buildList() {
    let resourceType;
    if (this.state.report.sections.show.clauseResourceTypes() === Clause.RESOURCE_TYPE_PEOPLE) {
      resourceType = Clause.RESOURCE_TYPE_PEOPLE;
    } else {
      resourceType = this.getSelectedResourceType();
    }
    switch(resourceType) {
      case Clause.RESOURCE_TYPE_ALL:
        return [
          ...this.allMatchingProperties(Clause.RESOURCE_TYPE_EVENTS),
          ...this.allMatchingProperties(Clause.RESOURCE_TYPE_PEOPLE),
        ];
      case Clause.RESOURCE_TYPE_EVENTS:
        return this.allMatchingProperties(Clause.RESOURCE_TYPE_EVENTS);
      case Clause.RESOURCE_TYPE_PEOPLE:
        return this.allMatchingProperties(Clause.RESOURCE_TYPE_PEOPLE);
      default:
        return [];
    }
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

  isShowingNonNumericProperties() {
    const screen = this.app.getBuilderCurrentScreen();
    return screen && !!screen.showingNonNumericProperties;
  }
}

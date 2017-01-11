import { BuilderScreenBase } from './builder-screen-base';
import { Clause, ShowClause } from '../../../models/clause';
import BaseQuery from '../../../models/queries/base';
import { extend, sorted, renameProperty, unique } from '../../../util';

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

  getRelevantBuilderEvents() {
    return this.app.getClauseValuesForType(ShowClause.TYPE);
  }

  isLoading() {
    return this.getRelevantBuilderEvents().every(mpEvent =>
      this.state.topEventPropertiesByEvent[mpEvent.name] === BaseQuery.LOADING
    );
  }

  buildList(resourceType) {
    if (!resourceType) {
      if (this.state.report.sections.show.clauseResourceTypes() === Clause.RESOURCE_TYPE_PEOPLE) {
        resourceType = Clause.RESOURCE_TYPE_PEOPLE;
      } else {
        resourceType = this.getSelectedResourceType();
      }
    }

    let properties = [];

    if ([Clause.RESOURCE_TYPE_ALL, Clause.RESOURCE_TYPE_EVENTS].includes(resourceType)) {
      let relevantEventProperties = this.getRelevantBuilderEvents().reduce((props, mpEvent) => {
        const eventProps = this.state.topEventPropertiesByEvent[mpEvent.name];
        if ([ShowClause.TOP_EVENTS.name, ShowClause.ALL_EVENTS.name].includes(mpEvent.name)) {
          return props.concat(this.state.topEventProperties);
        } else if (!eventProps) {
          this.app.fetchTopPropertiesForEvent(mpEvent.name);
        } else if (eventProps !== BaseQuery.LOADING) {
          return props.concat(eventProps);
        }
        return props;
      }, []);

      relevantEventProperties = unique(relevantEventProperties, {
        hash: prop => `${prop.name}:${prop.type}:${prop.resourceType}`,
      });

      properties = properties.concat(relevantEventProperties);
    }

    if ([Clause.RESOURCE_TYPE_ALL, Clause.RESOURCE_TYPE_PEOPLE].includes(resourceType)) {
      properties = properties.concat(this.state.topPeopleProperties);
    }

    properties = sorted(this.matchingItems(properties, renameProperty), {
      transform: prop => renameProperty(prop.name).toLowerCase(),
    });

    return properties;
  }
}

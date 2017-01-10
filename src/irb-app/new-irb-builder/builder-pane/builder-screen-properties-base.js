import { BuilderScreenBase } from './builder-screen-base';
import { Clause, ShowClause } from '../../../models/clause';
import BaseQuery from '../../../models/queries/base';
import { extend, unique } from '../../../util';

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

  getRelevantBuilderEvents() {
    return this.app.getClauseValuesForType(ShowClause.TYPE);
  }

  isLoading() {
    return this.getRelevantBuilderEvents().every(mpEvent =>
      this.state.topEventPropertiesByEvent[mpEvent.name] === BaseQuery.LOADING
    );
  }

  buildList() {
    const properties = this.getRelevantBuilderEvents().reduce((props, mpEvent) => {
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

    return unique(properties, {
      hash: prop => [prop.name, prop.type, prop.resourceType].join(`:`),
    });
  }
}

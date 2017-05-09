import {BuilderScreenBase} from './builder-screen-base';
import {Clause, GroupClause, ShowClause} from '../../../models/clause';
import BaseQuery from '../../../models/queries/base';
import {extend, indexSectionLists, sorted, renameProperty, unique} from '../../../util';

export class BuilderScreenPropertiesBase extends BuilderScreenBase {
  get config() {
    return {
      helpers: extend(super.config.helpers, {
        RESOURCE_TYPES: Clause.RESOURCE_TYPES,
        shouldShowSourceAlert: source => this.app.shouldAlertForSource(source),
        clickedResourceType: resourceType => this.app.updateBuilderCurrentScreen({resourceType}),
        getProperties: () => this.getProperties(),
        shouldShowPropertySections: () => this.shouldShowPropertySections(),
        getPropertySections: () => this.getPropertySections(),
        getSelectedResourceType: () => this.getSelectedResourceType(),
        getUpsellOptions: (resourceType, projectHasResource) => this.app.upsellTextOptions(resourceType, projectHasResource),
        shouldShowSourceUpsell: source => this.app.shouldUpsellForSource(source),
      }),
    };
  }

  shouldShowPropertySections(resourceType=this.getSelectedResourceType()) {
    return !(this.app.shouldUpsellForSource(resourceType) || this.app.shouldAlertForSource(resourceType));
  }

  filterToResourceType(type) {
    return function(property) {
      return type === ShowClause.RESOURCE_TYPE_ALL || property.resourceType === type;
    };
  }

  getMatchedRecentProperties() {
    // TODO: cassie match then filter
    const resourceType = this.getSelectedResourceType();
    const recentProperties = this.state.recentProperties
      .filter(property => resourceType === Clause.RESOURCE_TYPE_ALL || property.resourceType === resourceType)
      .slice(0, 3)
      .map(prop => extend(prop, {section: `recent`}));

    return this.matchingItems(recentProperties, renameProperty);
  }

  getProperties(resourceType=ShowClause.RESOURCE_TYPE_ALL) {
    const isLoading = this.isLoading();
    const properties = sorted(this.buildProgressiveList().filter(this.filterToResourceType(resourceType)), {
      transform: prop => (renameProperty(prop.name) || String(prop.name)).toLowerCase(),
    });

    if (this.prevIsLoading !== isLoading ||
        this.numProperties !== properties.length
    ) {
      this.prevIsLoading = isLoading;
      this.numProperties = properties.length;
      if (resourceType === ShowClause.RESOURCE_TYPE_EVENTS) {
        this.numEventProperties = properties.length;
      }
    }

    let specialProps = [];
    const isEventProperties = [Clause.RESOURCE_TYPE_ALL, Clause.RESOURCE_TYPE_EVENTS].includes(resourceType);
    const isForGroupClause = this.app.getActiveStageClause() && this.app.getActiveStageClause().TYPE === GroupClause.TYPE;
    if (isForGroupClause && isEventProperties) {
      specialProps = specialProps.concat(GroupClause.EVENT_DATE);
    }

    return [
      ...this.matchingItems(specialProps, renameProperty),
      ...properties,
    ].map((prop, index) => extend(prop, {index}));
  }

  getEventPropertyCount() {
    if (!this.eventPropertyCount) {
      this.eventPropertyCount = this.getEventProperties().length;
    }
    const matchingItems = this.matchingItems(this.buildList(ShowClause.RESOURCE_TYPE_EVENTS), renameProperty).length;
    return Math.min(this.eventPropertyCount, matchingItems);
  }

  getPropertySections() {
    const showEvents = this.shouldShowPropertySections(ShowClause.RESOURCE_TYPE_EVENTS);
    const showPeople = this.shouldShowPropertySections(ShowClause.RESOURCE_TYPE_PEOPLE);

    const resourceType = this.getSelectedResourceType();
    const eventPropertiesLoaded = this.numEventProperties >= this.getEventPropertyCount();
    const isPeopleQuery = this.state.report.sections.show.clauseResourceTypes() === Clause.RESOURCE_TYPE_PEOPLE;
    const includePeople =  !showEvents || eventPropertiesLoaded || isPeopleQuery || ShowClause.RESOURCE_TYPE_PEOPLE === resourceType;

    let sections = [];

    const recentProperties = this.getMatchedRecentProperties();
    if (recentProperties.length) {
      sections.push({
        label: `Recent Properties`,
        list: recentProperties,
      });
    }

    if (showEvents && [ShowClause.RESOURCE_TYPE_EVENTS, ShowClause.RESOURCE_TYPE_ALL].includes(resourceType) && !isPeopleQuery) {
      sections.push({
        label: `Event properties`,
        list: this.getProperties(ShowClause.RESOURCE_TYPE_EVENTS),
      });
    }
    if (showPeople && includePeople && ([ShowClause.RESOURCE_TYPE_PEOPLE, ShowClause.RESOURCE_TYPE_ALL].includes(resourceType) || isPeopleQuery)) {
      sections.push({
        label: `People properties`,
        list: this.getProperties(ShowClause.RESOURCE_TYPE_PEOPLE),
      });
    }

    return indexSectionLists(sections);
  }

  getSelectedResourceType() {
    return this.app.getBuilderCurrentScreenAttr(`resourceType`) || Clause.RESOURCE_TYPE_ALL;
  }

  getRelevantBuilderEvents() {
    return this.app.getClauseValuesForType(ShowClause.TYPE);
  }

  isLoading() {
    return this.getRelevantBuilderEvents().every(mpEvent =>
      this.state.topEventPropertiesByEvent[mpEvent.name] === BaseQuery.LOADING
    );
  }

  getEventProperties() {
    const properties = this.getRelevantBuilderEvents().reduce((props, mpEvent) => {
      const eventProps = this.state.topEventPropertiesByEvent[mpEvent.name];
      if ([ShowClause.TOP_EVENTS.name, ShowClause.ALL_EVENTS.name].includes(mpEvent.name)) {
        return props.concat(this.state.topEventProperties);
      } else if (!eventProps) {
        this.app.fetchTopPropertiesForEvent(mpEvent);
      } else if (eventProps !== BaseQuery.LOADING) {
        return props.concat(eventProps);
      }
      return props;
    }, []);

    return unique(properties, {
      hash: prop => `${prop.name}:${prop.type}:${prop.resourceType}`,
    });
  }

  getPeopleProperties() {
    return this.state.topPeopleProperties;
  }

  buildList(resourceType) {
    let properties = [];

    if (!resourceType) {
      if (this.state.report.sections.show.clauseResourceTypes() === Clause.RESOURCE_TYPE_PEOPLE) {
        resourceType = Clause.RESOURCE_TYPE_PEOPLE;
      } else {
        resourceType = this.getSelectedResourceType();
      }
    }

    if ([Clause.RESOURCE_TYPE_ALL, Clause.RESOURCE_TYPE_EVENTS].includes(resourceType)) {
      properties = properties.concat(this.getEventProperties());
    }

    if ([Clause.RESOURCE_TYPE_ALL, Clause.RESOURCE_TYPE_PEOPLE].includes(resourceType)) {
      properties = properties.concat(this.getPeopleProperties());
    }

    return this.matchingItems(properties, renameProperty);
  }
}

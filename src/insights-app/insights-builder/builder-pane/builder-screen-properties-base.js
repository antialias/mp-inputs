import {baseComparator} from 'mixpanel-common/util/array';

import {BuilderScreenBase} from './builder-screen-base';
import {Clause, GroupClause, ShowClause} from '../../../models/clause';
import BaseQuery from '../../../models/queries/base';
import {
  extend,
  formatSource,
  getIconForPropertyType,
  renameProperty,
  unique,
} from '../../../util';

export class BuilderScreenPropertiesBase extends BuilderScreenBase {
  get config() {
    return {
      helpers: extend(super.config.helpers, {
        getSources: () => this.app.getSources(),
        shouldShowSourceAlert: source => this.app.shouldAlertForSource(source),
        clickedSource: source => {
          const update = {};

          if ([Clause.RESOURCE_TYPE_EVENTS, Clause.RESOURCE_TYPE_ALL].includes(source)) {
            update.resourceType = source;
            update.profileType = null;
          } else {
            update.resourceType = Clause.RESOURCE_TYPE_PEOPLE;
            update.profileType = source;
          }

          this.app.updateBuilderCurrentScreen(update);
        },
        getProperties: () => this.getProperties(),
        shouldShowPropertySections: () => this.shouldShowPropertySections(),
        getPropertySections: () => this.getPropertySections(),
        getSelectedSource: () => this.getSelectedSource(),
        getUpsellOptions: (resourceType, projectHasResource) => this.app.upsellTextOptions(resourceType, projectHasResource),
        shouldShowSourceUpsell: source => this.app.shouldUpsellForSource(source),
      }),
    };
  }

  shouldShowPropertySections(source=this.getSelectedSource()) {
    return !(this.app.shouldUpsellForSource(source) || this.app.shouldAlertForSource(source));
  }

  getRecentProperties() {
    const source = this.getSelectedSource();
    const recentProperties = this.app.getRecentProperties()
      .filter(this.app.filterPropertiesBySource(source))
      .slice(0, 3)
      .map(prop => extend(prop, {section: `recent`}));

    const selected = this.getAttribute(`selected`);
    return recentProperties.map(prop => extend({
      label: renameProperty(prop.name),
      icon: getIconForPropertyType(prop.type),
      isSelected: prop.name === selected,
      profileType: source,
    }, prop));
  }

  getProperties(source=Clause.RESOURCE_TYPE_ALL) {
    const isLoading = this.isLoading();
    let properties = this.buildList()
      .filter(this.app.filterPropertiesBySource(source))
      .map(property => extend({
        label: renameProperty(property.name),
        icon: getIconForPropertyType(property.type),
        profileType: source,
      }, property))
      .sort(baseComparator({transform: prop => prop.label.toLowerCase()}));

    if (this.prevIsLoading !== isLoading ||
        this.numProperties !== properties.length
    ) {
      this.prevIsLoading = isLoading;
      this.numProperties = properties.length;
      if (source === Clause.RESOURCE_TYPE_EVENTS) {
        this.numEventProperties = properties.length;
      }
    }

    let specialProps = [];
    const isEventProperties = [Clause.RESOURCE_TYPE_ALL, Clause.RESOURCE_TYPE_EVENTS].includes(source);
    const isForGroupClause = this.app.getActiveStageClause() && this.app.getActiveStageClause().TYPE === GroupClause.TYPE;
    if (isForGroupClause && isEventProperties) {
      specialProps = specialProps.concat(GroupClause.EVENT_DATE);
    }

    const selected = this.getAttribute(`selected`);
    return [...specialProps, ...properties].map(prop => extend({
      isSelected: prop.name === selected,
    }, prop));
  }

  getEventPropertyCount() {
    if (!this.eventPropertyCount) {
      this.eventPropertyCount = this.getEventProperties().length;
    }
    const matchingItems = this.matchingItems(this.buildList(Clause.RESOURCE_TYPE_EVENTS), renameProperty).length;
    return Math.min(this.eventPropertyCount, matchingItems);
  }

  getPropertySections() {
    const showEvents = this.shouldShowPropertySections(Clause.RESOURCE_TYPE_EVENTS);
    const showPeople = this.shouldShowPropertySections(Clause.RESOURCE_TYPE_PEOPLE);

    const source = this.getSelectedSource();
    const resourceType = this.getSelectedResourceType();
    const eventPropertiesLoaded = this.numEventProperties >= this.getEventPropertyCount();
    const isPeopleQuery = this.state.report.sections.show.isPeopleOnlyQuery();
    const includePeople =  !showEvents || eventPropertiesLoaded || isPeopleQuery || Clause.RESOURCE_TYPE_PEOPLE === resourceType;

    let sections = [];

    const recentProperties = this.getRecentProperties();
    if (recentProperties.length) {
      sections.push({
        label: `Recent Properties`,
        items: recentProperties,
      });
    }

    const isResourceAll = resourceType === Clause.RESOURCE_TYPE_ALL;
    const isResourceEvents = resourceType === Clause.RESOURCE_TYPE_EVENTS;
    const isResourcePeople = resourceType === Clause.RESOURCE_TYPE_PEOPLE;

    const getSection = source => ({
      isLoading: this.isLoading(),
      label: formatSource(source, {property: true}),
      items: this.getProperties(source),
    });

    if (showEvents && !isPeopleQuery && (isResourceAll || isResourceEvents)) {
      sections.push(getSection(Clause.RESOURCE_TYPE_EVENTS));
    }

    if (showPeople && includePeople && (isResourceAll || isResourcePeople || isPeopleQuery)) {
      if (isResourceAll) {
        sections = sections.concat(
          this.app.getSources(Clause.RESOURCE_TYPE_PEOPLE)
            .map(source => source.profileType)
            .map(getSection)
        );
      } else {
        sections.push(getSection(source));
      }
    }

    return sections;
  }

  getSelectedSource() {
    return (
      this.app.getBuilderCurrentScreenAttr(`profileType`) ||
      this.app.getBuilderCurrentScreenAttr(`resourceType`) ||
      this.app.getSelectedSource()
    );
  }

  getSelectedResourceType() {
    return this.app.getBuilderCurrentScreenAttr(`resourceType`) || Clause.RESOURCE_TYPE_ALL;
  }

  getRelevantBuilderEvents() {
    return this.app.getClauseValuesForType(ShowClause.TYPE);
  }

  isLoading() {
    return this.getRelevantBuilderEvents().every(mpEvent =>
      this.app.getTopEventProperties(mpEvent) === BaseQuery.LOADING
    );
  }

  getEventProperties() {
    const properties = this.getRelevantBuilderEvents().reduce((props, mpEvent) => {
      const eventProps = this.app.getTopEventProperties(mpEvent);

      if ([ShowClause.TOP_EVENTS.name, ShowClause.ALL_EVENTS.name].includes(mpEvent.name)) {
        return props.concat(this.app.getTopEventProperties() || []);
      } else if (!eventProps) {
        // No properties loaded yet, fetch from api
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
    return this.app.getTopPeopleProperties();
  }

  buildList(resourceType) {
    let properties = [];

    if (!resourceType) {
      if (this.state.report.sections.show.isPeopleOnlyQuery()) {
        resourceType = Clause.RESOURCE_TYPE_PEOPLE;
      } else {
        resourceType = this.getSelectedResourceType();
      }
    }

    if ([Clause.RESOURCE_TYPE_ALL, Clause.RESOURCE_TYPE_EVENTS].includes(resourceType)) {
      properties = properties.concat(this.getEventProperties() || []);
    }

    if ([Clause.RESOURCE_TYPE_ALL, Clause.RESOURCE_TYPE_PEOPLE].includes(resourceType)) {
      properties = properties.concat(this.getPeopleProperties() || []);
    }

    return properties;
  }
}

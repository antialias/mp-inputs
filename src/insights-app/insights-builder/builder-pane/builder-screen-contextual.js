import {BuilderScreenBase} from './builder-screen-base';
import {Clause, GroupClause, ShowClause} from '../../../models/clause';
import {
  extend,
  formatSource,
  getLearnStep,
} from '../../../util';

import template from './builder-screen-contextual.jade';

document.registerElement(`builder-screen-contextual`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        clickedOption: option => {
          const {clauseType} = option;
          switch(clauseType) {
            case ShowClause.TYPE: {
              this.app.stopEditingClause();

              if (this.state.report.sections.show.isPeopleOnlyQuery()) {
                this.app.startAddingClause(clauseType, {resourceType: Clause.RESOURCE_TYPE_PEOPLE});
                this.nextScreen(`builder-screen-people`);
              } else {
                this.app.startAddingClause(clauseType, {resourceType: Clause.RESOURCE_TYPE_EVENTS});
                this.nextScreen(`builder-screen-events`);
              }
              break;
            }
            case GroupClause.TYPE: {
              this.app.stopEditingClause();
              this.app.startAddingClause(clauseType);
              this.nextScreen(`builder-screen-group-properties`);
              const isPeopleOnlyQuery = this.state.report.sections.show.isPeopleOnlyQuery();
              this.app.updateBuilderCurrentScreen({
                resourceType: isPeopleOnlyQuery ? Clause.RESOURCE_TYPE_PEOPLE : Clause.RESOURCE_TYPE_ALL,
                profileType: this.getSelectedSource(),
              });
              break;
            }
          }
        },
        getContextOptions: () => this.getContextOptions(),
        getSections: () => this.buildList(),
        clickedItem: ev => {
          const item = ev.detail.item;
          if (item.itemType === `event`) {
            this.clickedEvent(ev);
          } else if (item.itemType === `property`) {
            this.clickedProperty(ev);
          }
        },
        getDatasetDisplayName: () => this.app.getDatasetDisplayName(),
      }),
    };
  }

  getSelectedSource() {
    return this.app.getSelectedSource();
  }

  buildList() {
    let isGroupByDisabled = false;
    let isEventsDisabled = false;
    if (this.state.learnActive) {
      const currLearnStep = getLearnStep(this.state.report, this.state.learnModalStepIndex);
      if (currLearnStep) {
        isGroupByDisabled = currLearnStep.name !== `group-by`;
        isEventsDisabled = currLearnStep.name !== `compare-event`;
      }
    }

    let sections = this.app.getSources(Clause.RESOURCE_TYPE_PEOPLE).map(source => {
      const properties = this.allProperties(Clause.RESOURCE_TYPE_PEOPLE)
        .filter(this.app.filterPropertiesBySource(source))
        .map(item => extend(item, {
          isDisabled: isGroupByDisabled,
          itemType: `property`,
        }));

      return {
        label: `Group by ${formatSource(source.profileType, `a property`)}`,
        items: properties,
      };
    });

    if (this.state.report.sections.show.isEventsOnlyQuery()) {
      sections = [
        {
          label: `Group by an event property`,
          items: this.allProperties(Clause.RESOURCE_TYPE_EVENTS).map(item => extend(item, {
            isDisabled: isGroupByDisabled,
            itemType: `property`,
          })),
        },
        ...sections,
        {
          label: `Compare to an event`,
          items: this.allEvents().map(item => extend(item, {
            isDisabled: isEventsDisabled,
            itemType: `event`,
          })),
        },
      ];
    }

    return sections;
  }

  clickedProperty(ev) {
    const property = ev.detail.item;
    this.app.updateRecentProperties(property);
    this.app.startAddingClause(`group`);

    const clauseAttrs = {
      value: property.name,
      propertyType: property.type,
      resourceType: property.resourceType,
      profileType: property.profileType,
    };

    if (property.type === `datetime`) {
      clauseAttrs.editing = true;
      this.updateStageClause(clauseAttrs);
      this.nextScreen(`builder-screen-group-datetime-options`);
    } else {
      this.updateAndCommitStageClause(clauseAttrs);
    }
  }

  clickedEvent(ev) {
    const event = ev.detail.item;
    this.app.updateRecentEvents(event);
    this.app.startAddingClause(`show`);
    this.updateAndCommitStageClause({
      value: event,
      resourceType: Clause.RESOURCE_TYPE_EVENTS,
    });
  }

  getContextOptions() {
    const source = this.getSelectedSource();
    let options = [];

    if (source === Clause.RESOURCE_TYPE_EVENTS) {
      options = [
        {name: `Group by a property`, clauseType: GroupClause.TYPE},
        {name: `Compare to an event`, clauseType: ShowClause.TYPE},
      ];
    } else {
      const sourceDescription = formatSource(source, `a property`);
      options = [
        {name: `Group by ${sourceDescription}`, clauseType: GroupClause.TYPE},
        {name: `Compare to ${sourceDescription}`, clauseType: ShowClause.TYPE},
      ];
    }

    return options.map((option, index) => extend(option, {index}));
  }
});

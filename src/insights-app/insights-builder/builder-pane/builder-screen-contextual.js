import {BuilderScreenBase} from './builder-screen-base';
import {Clause, GroupClause, ShowClause} from '../../../models/clause';
import {extend, getLearnStep} from '../../../util';

import template from './builder-screen-contextual.jade';

const CONTEXT_OPTIONS = {
  [ShowClause.RESOURCE_TYPE_EVENTS]: [
    {name: `Group by a property`, clauseType: GroupClause.TYPE},
    {name: `Compare to an event`, clauseType: ShowClause.TYPE},
  ],
  [ShowClause.RESOURCE_TYPE_PEOPLE]: [
    {name: `Group by a people property`,   clauseType: GroupClause.TYPE},
    {name: `Compare to a people property`, clauseType: ShowClause.TYPE},
  ],
};

document.registerElement(`builder-screen-contextual`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        clickedOption: option => {
          const {clauseType} = option;
          switch(clauseType) {
            case ShowClause.TYPE: {
              const resourceType = this.state.report.sections.show.clauseResourceTypes();
              this.app.stopEditingClause();
              this.app.startAddingClause(clauseType, {resourceType});
              this.nextScreen(`builder-screen-${resourceType}`);
              break;
            }
            case GroupClause.TYPE: {
              this.app.stopEditingClause();
              this.app.startAddingClause(clauseType);
              this.nextScreen(`builder-screen-group-properties`);
              const isPeopleOnlyQuery = this.state.report.sections.show.isPeopleOnlyQuery();
              this.app.updateBuilderCurrentScreen({
                resourceType: isPeopleOnlyQuery ? ShowClause.RESOURCE_TYPE_PEOPLE : ShowClause.RESOURCE_TYPE_ALL,
              });
              break;
            }
          }
        },
        getContextOptions: () => {
          return (CONTEXT_OPTIONS[this.state.report.sections.show.clauseResourceTypes()] || [])
            .map((option, index) => extend(option, {index}));
        },
        getSections: () => this.buildList(),
        clickedItem: ev => {
          const item = ev.detail.item;
          if (item.itemType === `event`) {
            this.clickedEvent(ev);
          } else if (item.itemType === `property`) {
            this.clickedProperty(ev);
          }
        },
      }),
    };
  }

  buildList() {
    const resourceTypes = this.state.report.sections.show.clauseResourceTypes();
    if (resourceTypes === ShowClause.RESOURCE_TYPE_EVENTS) {
      const currLearnStep = getLearnStep(this.state.report, this.state.learnModalStepIndex);
      const isGroupByDisabled = !!currLearnStep && currLearnStep.name !== `group-by`;
      const isEventsDisabled = !!currLearnStep && currLearnStep.name !== `compare-event`;

      return [
        {
          label: `Group by an event property`,
          items: this.allProperties(Clause.RESOURCE_TYPE_EVENTS).map(item => extend(item, {
            isDisabled: isGroupByDisabled,
            itemType: `property`,
          })),
        },
        {
          label: `Group by a people property`,
          items: this.allProperties(Clause.RESOURCE_TYPE_PEOPLE).map(item => extend(item, {
            isDisabled: isGroupByDisabled,
            itemType: `property`,
          })),
        },
        {
          label: `Compare to an event`,
          items: this.allEvents().map(item => extend(item, {
            isDisabled: isEventsDisabled,
            itemType: `event`,
          })),
        },
      ];
    } else if (resourceTypes === ShowClause.RESOURCE_TYPE_PEOPLE) {
      return [
        {
          label: `Group by a people property`,
          items: this.allProperties(Clause.RESOURCE_TYPE_PEOPLE).map(item => extend(item, {
            itemType: `property`,
          })),
        },
      ];
    }
  }

  clickedProperty(ev) {
    const property = ev.detail.item;
    this.app.startAddingClause(`group`);
    const newClause = {
      propertyType: property.type,
      resourceType: property.resourceType,
      value: property.name,
    };
    if (property.type === `datetime`) {
      newClause.editing = true;
      this.updateStageClause(newClause);
      this.nextScreen(`builder-screen-group-datetime-options`);
    } else {
      this.updateAndCommitStageClause(newClause);
    }
  }

  clickedEvent(ev) {
    const value = ev.detail.item;
    this.app.startAddingClause(`show`);
    this.updateStageClause({value}, {shouldCommit: true, shouldStopEditing: true});
  }
});

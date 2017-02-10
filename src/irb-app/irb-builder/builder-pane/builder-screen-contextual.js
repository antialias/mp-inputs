import { BuilderScreenBase } from './builder-screen-base';
import { Clause, GroupClause, ShowClause } from '../../../models/clause';
import { extend } from '../../../util';

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
            case GroupClause.TYPE:
              this.app.stopEditingClause();
              this.app.startAddingClause(clauseType);
              this.nextScreen(`builder-screen-group-properties`);
              break;
          }
        },
        getContextOptions: () => CONTEXT_OPTIONS[this.state.report.sections.show.clauseResourceTypes()] || [],
        getContextLists: () => this.buildProgressiveList(),
        clickedProperty: (ev, property) => {
          this.app.startAddingClause(`group`);
          this.updateAndCommitStageClause({
            propertyType: property.type,
            resourceType: property.resourceType,
            value: property.name,
          });
        },
        clickedEvent: value => {
          this.app.startAddingClause(`show`);
          this.updateStageClause({value}, {shouldCommit: true, shouldStopEditing: true});
        },
      }),
    };
  }

  buildList() {
    switch(this.state.report.sections.show.clauseResourceTypes()) {
      case ShowClause.RESOURCE_TYPE_EVENTS:
        return [
          {
            label: `Group by an event property`,
            list: this.allMatchingProperties(Clause.RESOURCE_TYPE_EVENTS),
            resourceType: `property`,
          },
          {
            label: `Group by a people property`,
            list: this.allMatchingProperties(Clause.RESOURCE_TYPE_PEOPLE),
            resourceType: `property`,
          },
          {
            label: `Compare to an event`,
            list: this.allMatchingEvents(),
            resourceType: `event`,
          },
        ];
      case ShowClause.RESOURCE_TYPE_PEOPLE:
        return [
          {
            label: `Group by a people property`,
            list: this.allMatchingProperties(Clause.RESOURCE_TYPE_PEOPLE),
            resourceType: `property`,
          },
        ];
      default:
        return [];
    }
  }

  buildProgressiveList() {
    let listSize = this.progressiveListSize;
    const fullList = this.buildList();
    const outList = [];
    while (listSize > 0 && fullList.length) {
      let source = fullList.shift();
      outList.push(extend(source, {list: source.list.slice(0, listSize)}));
      listSize -= source.list.length;
    }
    return outList;
  }

  progressiveListLength() {
    return this.buildList().reduce((sum, source) => sum + source.list.length, 0);
  }
});

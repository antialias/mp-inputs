import {BuilderScreenBase} from './builder-screen-base';
import {Clause} from '../../../models/clause';
import {extend} from '../../../util';

import template from './builder-screen-sources.jade';

document.registerElement(`builder-screen-sources`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        RESOURCE_TYPE_ALL: Clause.RESOURCE_TYPE_ALL,
        getSources: () => {
          this.updateRenderedSizeOnNextFrame();
          return this.app.getSources().map((source, index) => extend(source, {index}));
        },
        getSelectedSource: () => {
          const profileType = this.app.originStageClauseValue(`profileType`);
          const resourceType = this.app.originStageClauseValue(`resourceType`);
          return profileType || resourceType;
        },
        getSelectedResourceType: () => {
          const isPeopleProperty = this.app.originStageClauseIsPeopleProperty();
          return isPeopleProperty ? Clause.RESOURCE_TYPE_PEOPLE : Clause.RESOURCE_TYPE_EVENTS;
        },
        clickedSource: ev => {
          const resourceType = ev.detail.selected;
          const stageClauseUpdate = {resourceType, value: {}};

          // TODO @evnp - remove once we have multiple people tables on backend
          if (resourceType === Clause.RESOURCE_TYPE_EVENTS) {
            stageClauseUpdate.profileType = null;
          } else {
            stageClauseUpdate.profileType = resourceType;
            stageClauseUpdate.resourceType = Clause.RESOURCE_TYPE_PEOPLE;
          }
          // TODO @evnp END

          this.updateStageClause(stageClauseUpdate);
          this.updateRenderedSizeOnNextFrame();
        },
        getSections: () => this.buildList(),
        updateRenderedSizeOnNextFrame: () => this.updateRenderedSizeOnNextFrame(),
        clickedItem: ev => {
          const item = ev.detail.item;
          if (item.itemType === `event`) {
            this.helpers.clickedEvent(ev);
          } else if (item.itemType === `property`) {
            this.helpers.clickedProperty(ev);
          }
        },
        shouldShowSourceUpsell: resourceType => this.app.shouldUpsellForSource(resourceType),
        shouldShowSourceAlert: resourceType => this.app.shouldAlertForSource(resourceType),
      }),
    };
  }

  buildList() {
    return [
      {
        label: `Events`,
        items: this.allEvents().map(event => {
          return extend(event, {
            itemType: `event`,
            hasPropertiesPill: true,
            isPropertiesPillDisabled: this.state.learnActive,
          });
        }),
      },
      {
        label: `People properties`,
        items: this.allProperties(Clause.RESOURCE_TYPE_PEOPLE).map(property => {
          return extend(property, {
            itemType: `property`,
            isDisabled: this.state.learnActive,
          });
        }),
      },
    ];
  }
});

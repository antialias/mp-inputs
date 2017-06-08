import {BuilderScreenBase} from './builder-screen-base';
import {Clause} from '../../../models/clause';
import {extend, formatSource} from '../../../util';

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
        getSelectedSource: () => this.getSelectedSource(),
        getSelectedResourceType: () => {
          const isPeopleProperty = this.app.originStageClauseIsPeopleProperty();
          return isPeopleProperty ? Clause.RESOURCE_TYPE_PEOPLE : Clause.RESOURCE_TYPE_EVENTS;
        },
        clickedSource: ev => {
          const source = ev.detail.selected;
          const clauseAttrs = {value: {}};

          if ([Clause.RESOURCE_TYPE_EVENTS, Clause.RESOURCE_TYPE_ALL].includes(source)) {
            clauseAttrs.resourceType = source;
            clauseAttrs.profileType = null;
          } else {
            clauseAttrs.resourceType = Clause.RESOURCE_TYPE_PEOPLE;
            clauseAttrs.profileType = source;
          }

          this.updateStageClause(clauseAttrs);
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

  getSelectedSource() {
    return this.app.getSelectedSource(this.app.originStageClause);
  }

  buildList() {
    const properties = this.allProperties(Clause.RESOURCE_TYPE_PEOPLE);
    return [
      {
        label: `Events`,
        items: this.allEvents().map(event => extend(event, {
          itemType: `event`,
          hasPropertiesPill: true,
          isPropertiesPillDisabled: this.state.learnActive,
        })),
      },
      ...this.app.getSources(Clause.RESOURCE_TYPE_PEOPLE).map(source => ({
        label: `${formatSource(source.profileType)} properties`,
        items: properties
          .filter(this.app.filterPropertiesBySource(source.profileType))
          .map(item => extend(item, {
            itemType: `property`,
            isDisabled: this.state.learnActive,
            profileType: source.profileType,
          })),
      })),
    ];
  }
});

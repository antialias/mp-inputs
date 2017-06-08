import {BuilderScreenBase} from './builder-screen-base';
import {Clause} from '../../../models/clause';
import {extend, pick} from '../../../util';

import template from './builder-screen-sources.jade';

const SOURCES = [
  {name: `Events`, resourceType: `events`},
  {name: `People`, resourceType: `people`},
];

document.registerElement(`builder-screen-sources`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      defaultState: {
        lexiconUrl: `${window.location.protocol}//${window.location.hostname}${window.location.pathname.replace(`insights`, `lexicon`)}?from=definition`,
      },
      helpers: extend(super.config.helpers, {
        getSources: () => {
          this.updateRenderedSizeOnNextFrame();
          let indexedSources = SOURCES.slice();
          return indexedSources.map((source, index) => extend(source, {index}));
        },
        getSelectedResourceType: () => {
          return this.app.originStageClauseIsPeopleProperty() ? `people` : `events`;
        },
        clickedSource: ev => {
          const resourceType = ev.detail.selected;
          this.updateStageClause({resourceType, value: {}});
        },
        handleItemFocus: ev => {
          const item = ev.detail.item;
          const definition = item.definition;
          if (definition && definition.description) {
            const eventDefinition = pick(definition, [`description`, `verified`, `isMixpanelDefinition`]);
            eventDefinition.name = item.label;
            if (definition.verified && !definition.isMixpanelDefinition) {
              eventDefinition.verifiedBy = definition.lastVerifiedBy.name || definition.lastVerifiedBy.email;
              eventDefinition.verifiedDate = definition.lastVerified;
            }
            this.update({eventDefinition});
          } else {
            if (this.state.eventDefinition) {
              this.update({eventDefinition: null});
            }
          }
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

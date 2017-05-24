import {BuilderScreenBase} from '../builder-pane/builder-screen-base';
import {ShowClause} from '../../../models/clause';
import TopEventsQuery from '../../../models/queries/top-events';
import {
  extend,
  getIconForEvent,
  getDescriptionForEvent,
  renameEvent,
} from '../../../util';

import template from './builder-screen-events.jade';

document.registerElement(`builder-screen-events`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      defaultState: {
        lexiconUrl: `${window.location.protocol}//${window.location.hostname}${window.location.pathname.replace(`insights`, `lexicon`)}`,
      },
      helpers: extend(super.config.helpers, {
        getSections: () => {
          let topEvents = [];
          if (this.app.getTopEvents() && this.app.getTopEvents() !== TopEventsQuery.LOADING) {
            topEvents = [
              extend(ShowClause.TOP_EVENTS, {isDisabled: this.state.learnActive}),
              extend(ShowClause.ALL_EVENTS, {isDisabled: this.state.learnActive}),
            ].concat(this.app.getTopEvents());
          }

          return [{
            label: `Recently Viewed`,
            items: this.processItems(this.app.getRecentEvents().slice(0, 3)),
          }, {
            label: `Events`,
            items: this.processItems(topEvents),
          }];
        },
        showTooltipForItem: item => {
          if (item.description) {
            this.helpers.showEventDefinitionTooltip();
            this.update({eventDefinition: {name: item.label, description: item.description}});
          }
        },
        hideEventDefinitionTooltip: () => {
          if (this.state.eventDefinition) {
            this.hideEventDefinitionTooltipTimeout = setTimeout(() => {
              this.hideEventDefinitionTooltipTimeout = null;
              this.update({eventDefinition: null});
            }, 250);
          }
        },
        showEventDefinitionTooltip: () => {
          if (this.hideEventDefinitionTooltipTimeout) {
            clearTimeout(this.hideEventDefinitionTooltipTimeout);
          }
        },
      }),
    };
  }

  processItems(items) {
    const selected = this.getAttribute(`selected`);
    return items.map(item => extend({
      label: renameEvent(item.name),
      icon: getIconForEvent(item),
      hasPropertiesPill: true,
      isPropertiesPillDisabled: this.state.learnActive,
      isSelected: item.name === selected,
      description: getDescriptionForEvent(item, this.state.eventDefinitions),
    }, item));
  }
});

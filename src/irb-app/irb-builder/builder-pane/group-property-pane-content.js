import { Clause } from '../../../models/clause';
import { PaneContent } from '../../pane';
import { extend } from '../../../util';

import template from './group-property-pane-content.jade';

document.registerElement('group-property-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template,

      helpers: extend(super.config.helpers, {
        isSelectedProperty: (property) => (
          super.config.helpers.getActiveClauseProperty('value') === property.name &&
          super.config.helpers.getActiveClauseProperty('resourceType') === property.resourceType
        ),
        paneHandler: (property, shouldClosePane) => {
          const filterType = property.type;
          const originalValue = this.app.activeStageClause.value;
          const paneIndex = this.app.hasStageClause() ? this.app.activeStageClause.paneIndex : 0;
          const resourceType = property.resourceType;
          const value = property.name;

          this.config.helpers.updateStageClause({filterType, resourceType, value}, shouldClosePane);

          // when a property is selected, switch to the property value inner pane
          // - requestAnimationFrame allows the add pane to be re-rendered as an
          //   edit pane, and still show the css animation sliding to the new pane
          if (!shouldClosePane) {
            if (this.app.originStageClauseType() !== 'filter') {
              this.app.startAddingClause('filter', {paneIndex});
            } else if (value !== originalValue) {
              this.app.updateStageClause({filterValue: null});
            }
            this.app.updateStageClause({value, resourceType});
            window.requestAnimationFrame(() => {
              this.app.updateStageClause({paneIndex: paneIndex + 1});
            });
          }
        },
        onPropertyArrowClick: (ev, property) => {
          ev.stopPropagation();
          this.config.helpers.paneHandler(property, false);
        },
        selectProperty: property => this.config.helpers.paneHandler(property, this.app.originStageClauseType() !== 'filter'),
        topProperties: () => {
          switch (this.state.resourceTypeFilter) {
            case 'events':
              return this.state.topEventProperties;
            case 'people':
              return this.state.topPeopleProperties;
            default:
              return this.state.topEventProperties.concat(this.state.topPeopleProperties).sort((a, b) => b.count - a.count);
          }
        },
        updateResourceTypeFilter: resourceTypeFilter => this.app.update({resourceTypeFilter}),
      }),
    });
  }

  get resourceTypeChoices() {
    return Clause.RESOURCE_TYPES;
  }

  get section() {
    return 'group';
  }
});

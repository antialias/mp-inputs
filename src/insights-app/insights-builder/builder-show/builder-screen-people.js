import {BuilderScreenNumericPropertiesBase} from '../builder-pane/builder-screen-numeric-properties-base';
import BaseQuery from '../../../models/queries/base';
import {ShowClause} from '../../../models/clause';
import {
  capitalize,
  extend,
  getIconForPropertyType,
  renameProperty,
} from '../../../util';

import template from './builder-screen-people.jade';

document.registerElement(`builder-screen-people`, class extends BuilderScreenNumericPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getPropertySections: () => {
          const source = this.getAttribute(`source`);
          return [{
            label: this.getAttribute(`label`),
            items: this.processItems([extend(ShowClause.ALL_PEOPLE, {
              label: `All ${capitalize(source)}`,
            })]),
          }, {
            label: `Properties apply to all ${source}`,
            items: this.processItems(this.buildList()),
            isLoading: this.app.getTopPeopleProperties() === BaseQuery.LOADING,
          }];
        },
        clickedItem: ev => {
          const item = ev.detail.item;
          if (item.name === ShowClause.ALL_PEOPLE.name) {
            this.updateAndCommitStageClause({value: item, property: null});
          } else {
            this.helpers.clickedProperty(ev);
          }
        },
        isEmbedded: () => this.isEmbedded(),
      }),
    };
  }

  processItems(items) {
    const selected = this.getAttribute(`selected`);
    return items.map(item => extend({
      label: item.label || renameProperty(item.name),
      icon: item.icon || getIconForPropertyType(item.type),
      isSelected: item.name === selected,
    }, item));
  }

  buildList() {
    let properties = super.buildList(ShowClause.RESOURCE_TYPE_PEOPLE);

    // TODO @evnp - remove once we have multiple people tables on backend
    const source = this.getAttribute(`source`);
    if (source && Array.isArray(properties)) {
      properties = properties.filter(Boolean).filter(property =>
        property.resourceType === source || (
          property.profileTypes && property.profileTypes.includes(source)
        )
      );
    }
    // TODO @evnp END

    return this.filterNonNumericProperties(properties);
  }
});

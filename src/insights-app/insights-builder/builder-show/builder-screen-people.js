import {BuilderScreenNumericPropertiesBase} from '../builder-pane/builder-screen-numeric-properties-base';
import BaseQuery from '../../../models/queries/base';
import {Clause, ShowClause} from '../../../models/clause';
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
        getTitle: () => `${this.app.getDataset()} ${this.getSelectedSource()}`,
        getPropertySections: () => {
          const source = this.getSelectedSource();
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
        isEmbedded: () => this.isEmbedded(),
      }),
    };
  }

  getSelectedSource() {
    return this.getAttribute(`source`) || this.app.getSelectedSource();
  }

  processItems(items) {
    const source = this.getSelectedSource();
    const selected = this.getAttribute(`selected`);

    return items.map(item => extend({
      label: item.label || renameProperty(item.name),
      icon: item.icon || getIconForPropertyType(item.type),
      isSelected: item.name === selected,
      profileType: source,
    }, item));
  }

  buildList() {
    let properties = super.buildList(Clause.RESOURCE_TYPE_PEOPLE);

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

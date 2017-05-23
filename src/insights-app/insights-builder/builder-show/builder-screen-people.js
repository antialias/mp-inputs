import {BuilderScreenNumericPropertiesBase} from '../builder-pane/builder-screen-numeric-properties-base';
import BaseQuery from '../../../models/queries/base';
import {ShowClause} from '../../../models/clause';
import {extend, getIconForPropertyType, renameProperty} from '../../../util';

import template from './builder-screen-people.jade';

document.registerElement(`builder-screen-people`, class extends BuilderScreenNumericPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getPropertySections: () => {
          return [{
            items: this.processItems([ShowClause.ALL_PEOPLE]),
          }, {
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
    return this.filterNonNumericProperties(super.buildList(ShowClause.RESOURCE_TYPE_PEOPLE));
  }
});

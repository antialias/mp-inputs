import {BuilderScreenNumericPropertiesBase} from '../builder-pane/builder-screen-numeric-properties-base';
import BaseQuery from '../../../models/queries/base';
import {ShowClause} from '../../../models/clause';
import {extend, indexSectionLists} from '../../../util';

import template from './builder-screen-people.jade';

document.registerElement(`builder-screen-people`, class extends BuilderScreenNumericPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getAllPeopleProperties: () => this.getAllPeopleProperties().filter(section => section.list.length),
      }),
    };
  }

  clickedSpecialOptions(ev, value) {
    this.updateAndCommitStageClause({value, property: null});
  }
  
  getSpecialOptions() {
    return [extend(ShowClause.ALL_PEOPLE, {icon: `profile`})];
  }

  getAllPeopleProperties() {
    let sections = [{
      clickedPropertyFunction: (ev, value) => this.clickedSpecialOptions(ev, value),
      list: this.getSpecialOptions(),
      showLoading: false,
    }, {
      clickedPropertyFunction: null,
      list: this.buildProgressiveList(),
      showLoading: true,
    }];

    return indexSectionLists(sections);
  }

  isLoading() {
    return this.state.topPeopleProperties === BaseQuery.LOADING;
  }

  buildList() {
    return this.filterNonNumericProperties(super.buildList(ShowClause.RESOURCE_TYPE_PEOPLE));
  }
});

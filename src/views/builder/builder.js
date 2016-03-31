import BaseView from '../base';
import ShowView from './show';
import TimeView from './time';
import GroupView from './group';
import FilterView from './filter';

import template from '../templates/builder/builder.jade';
import '../stylesheets/builder/builder.styl';

export default class BuilderView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      show: new ShowView(this),
      time: new TimeView(this),
      group: new GroupView(this),
      filter: new FilterView(this),
    };
  }

  get templateHandlers() {
    return {
    };
  }
}

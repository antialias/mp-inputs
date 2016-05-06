import BaseView from './base';

import template from './templates/header.jade';
import './stylesheets/header.styl';

import '../elements/auto-sizing-input';

export default class HeaderView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get templateHandlers() {
    return {
      updateReportName: ev => this.app.update({reportName: ev.target.value}),
    };
  }
}

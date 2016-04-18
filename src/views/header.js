import BaseView from './base';

import template from './templates/header.jade';
import './stylesheets/header.styl';

import { register as registerAutoSizingInput } from '../elements/auto-sizing-input';
registerAutoSizingInput();

export default class HeaderView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get templateHandlers() {
    return {
      updateReportName: ev => this.app.update({name: ev.target.value}),
    };
  }
}

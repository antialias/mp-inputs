import { View } from 'panel';

import template from '../templates/header.jade';
import '../stylesheets/header.styl';

import { register as registerAutoSizingInput } from '../elements/auto-sizing-input';
registerAutoSizingInput();

export default class HeaderView extends View {
  get TEMPLATE() {
    return template;
  }

  get templateHandlers() {
    return {
      updateReportName: ev => this.app.update({reportName: ev.target.value}),
    };
  }
}

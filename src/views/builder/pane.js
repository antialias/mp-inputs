import { View } from 'panel';

import template from '../templates/builder/pane.jade';
import '../stylesheets/builder/pane.styl';

export default class PaneView extends View {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
    };
  }

  get templateHandlers() {
    return {
    };
  }

  get templateHelpers() {
    return {
    };
  }
}

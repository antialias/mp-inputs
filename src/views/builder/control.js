import { View } from 'panel';

import template from '../templates/builder/control.jade';
import '../stylesheets/builder/control.styl';

export default class ControlView extends View {
  get TEMPLATE() {
    return template;
  }

  get templateHelpers() {
    return {
      getLabelConnector: () => ', ',
    };
  }
}

import { View } from 'panel';

import template from '../templates/builder/group.jade';
import '../stylesheets/builder/group.styl';

export default class GroupView extends View {
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
}

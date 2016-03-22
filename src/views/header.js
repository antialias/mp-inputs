import { View } from 'panel';

import template from '../templates/header.jade';
import '../stylesheets/header.styl';

export default class HeaderView extends View {
  get TEMPLATE() {
    return template;
  }

  get templateHandlers() {
    return {
      clickNew: () => this.app.navigate('mix'),
      clickList: () => this.app.navigate('list'),
    };
  }
}

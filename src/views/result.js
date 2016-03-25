import { View } from 'panel';

import template from '../templates/result.jade';
import '../stylesheets/result.styl';

export default class ResultView extends View {
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

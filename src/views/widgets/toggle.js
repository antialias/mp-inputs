import BaseView from '../base';

import template from '../templates/widgets/toggle.jade';
import '../stylesheets/widgets/toggle.styl';

export default class ToggleView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get templateHelpers() {
    return {
      formatChoice: choice => this.formatChoice(choice),
    };
  }

  formatChoice(choice) {
    return choice;
  }

  get templateHandlers() {
    return {
      onChoiceClick: choice => this.select(choice),
    };
  }

  select(choice) {
    throw new Error('Must be implemented by subclass');
  }
}

import BaseView from '../base';

import template from '../templates/widgets/toggle.jade';
import '../stylesheets/widgets/toggle.styl';

export default class ToggleView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get templateHelpers() {
    return {
      getChoices: () => this.choices,
      getSelected: () => this.selected,
      formatChoice: choice => this.formatChoice(choice),
    };
  }

  get templateHandlers() {
    return {
      onChoiceClick: choice => this.select(choice),
    };
  }

  get choices() {
    throw new Error('Must be implemented by subclass');
  }

  get selected() {
    throw new Error('Must be implemented by subclass');
  }

  formatChoice(choice) {
    return choice;
  }

  select() {
    throw new Error('Must be implemented by subclass');
  }
}

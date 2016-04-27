import BaseView from '../base';

import template from '../templates/widgets/dropdown.jade';
import '../stylesheets/widgets/dropdown.styl';

export default class DropdownView extends BaseView {
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
      onLabelClick: () => this.toggleOpen(),
      onChoiceClick: choice => this.select(choice),
    };
  }

  toggleOpen() {
    throw new Error('Must be implemented by subclass');
  }

  select(choice) {
    throw new Error('Must be implemented by subclass');
  }
}

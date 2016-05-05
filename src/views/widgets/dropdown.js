import BaseView from '../base';

import template from '../templates/widgets/dropdown.jade';
import '../stylesheets/widgets/dropdown.styl';

export default class DropdownView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get templateHelpers() {
    return {
      getChoices: () => this.choices,
      getSelected: () => this.selected,
      isOpen: () => this.isOpen,
      formatChoice: choice => this.formatChoice(choice),
    };
  }

  get templateHandlers() {
    return {
      onLabelClick: () => this.toggleOpen(),
      onChoiceClick: choice => this.select(choice),
    };
  }

  get choices() {
    throw new Error('Must be implemented by subclass');
  }

  get selected() {
    throw new Error('Must be implemented by subclass');
  }

  get isOpen() {
    throw new Error('Must be implemented by subclass');
  }

  formatChoice(choice) {
    return choice;
  }

  toggleOpen() {
    throw new Error('Must be implemented by subclass');
  }

  select() {
    throw new Error('Must be implemented by subclass');
  }
}

import { Component } from 'panel';

import template from './dropdown.jade';
import './dropdown.styl';

export default class Dropdown extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, 'stopEditingClauseAttrs');
  }

  get config() {
    return {
      template,

      helpers: {
        getChoices: () => this.choices,
        getSelected: () => this.selected,
        isOpen: () => this.isOpen,
        formatChoice: choice => this.formatChoice(choice),
        onLabelClick: () => this.toggleOpen(),
        onChoiceClick: choice => this.select(choice),
      },
    };
  }

  get choices() {
    throw new Error('Must be implemented by subclass');
  }

  formatChoice(choice) {
    return choice;
  }

  get isOpen() {
    throw new Error('Must be implemented by subclass');
  }

  select() {
    throw new Error('Must be implemented by subclass');
  }

  get selected() {
    throw new Error('Must be implemented by subclass');
  }

  toggleOpen() {
    throw new Error('Must be implemented by subclass');
  }
}

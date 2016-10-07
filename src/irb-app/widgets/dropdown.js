import { Component } from 'panel';

import template from './dropdown.jade';
import './dropdown.styl';

export default class Dropdown extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, `stopEditingClauseAttrs`);
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
    throw `Not implemented!`;
  }

  formatChoice(choice) {
    return choice;
  }

  get isOpen() {
    throw `Not implemented!`;
  }

  select() {
    throw `Not implemented!`;
  }

  get selected() {
    throw `Not implemented!`;
  }

  toggleOpen() {
    throw `Not implemented!`;
  }
}

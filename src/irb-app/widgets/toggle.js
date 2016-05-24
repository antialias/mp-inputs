import { Component } from 'panel';

import template from './toggle.jade';
import './toggle.styl';

export default class Toggle extends Component {
  get config() {
    return {
      template,

      helpers: {
        getChoices: () => this.choices,
        getSelected: () => this.selected,
        formatChoice: choice => this.formatChoice(choice),
        formatChoiceClass: choice => this.formatChoiceClass(choice),
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

  formatChoiceClass() {
    return '';
  }

  // expected args: choice (the option to select)
  select() {
    throw new Error('Must be implemented by subclass');
  }

  get selected() {
    throw new Error('Must be implemented by subclass');
  }
}

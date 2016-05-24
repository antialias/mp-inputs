// Basic UI toggles for filters

import { Component } from 'panel';

import { FilterClause } from '../../../models/clause';

import template from './toggle.jade';
import './toggle.styl';

class Toggle extends Component {
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

document.registerElement('operator-toggle', class extends Toggle {
  get choices() {
    return FilterClause.FILTER_OPERATORS[this.state.stageClause.filterType];
  }

  select(filterOperator) {
    this.app.updateStageClause({filterOperator});
  }

  get selected() {
    return this.state.stageClause.filterOperator;
  }
});

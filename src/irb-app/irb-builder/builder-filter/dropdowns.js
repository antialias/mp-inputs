// Basic UI widgets for filters

import { Component } from 'panel';

import { FilterClause, TimeClause } from '../../../models/clause';
import { extend } from '../../../util';

import template from './dropdown.jade';
import './dropdown.styl';

class Dropdown extends Component {
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

document.registerElement('operator-dropdown', class extends Dropdown {
  get choices() {
    return FilterClause.FILTER_OPERATORS[this.state.stageClause.filterType];
  }

  get isOpen() {
    return this.state.stageClause.isEditingFilterOperator;
  }

  select(filterOperator) {
    this.app.updateStageClause({
      filterOperator,
      filterValue: null,
      filterSearch: null,
      editing: null,
    });
  }

  get selected() {
    return this.state.stageClause.filterOperator;
  }

  toggleOpen() {
    this.app.updateStageClause({
      editing: this.state.stageClause.isEditingFilterOperator ? null : 'filterOperator',
    });
  }
});


document.registerElement('date-unit-dropdown', class extends Dropdown {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        formatChoice: choice => `${choice}s`,
      }),
    });
  }

  get choices() {
    return TimeClause.UNIT_CHOICES;
  }

  get selected() {
    return this.state.stageClause.filterDateUnit;
  }

  get isOpen() {
    return this.state.stageClause.isEditingFilterDateUnit;
  }

  toggleOpen() {
    this.app.updateStageClause({
      editing: this.state.stageClause.isEditingFilterDateUnit ? null : 'filterDateUnit',
    });
  }

  select(filterDateUnit) {
    this.app.updateStageClause({
      filterDateUnit,
      editing: null,
    });
  }
});

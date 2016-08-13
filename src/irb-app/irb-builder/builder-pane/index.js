import {
  extend,
  renameProperty,
} from '../../../util';

import { Pane } from '../../pane';
import { FilterClause, TimeClause } from '../../../models/clause';
import Dropdown from '../../widgets/dropdown';
import Toggle from '../../widgets/toggle';

import './event-pane-content';
import './filter-property-value-pane-content';
import './group-property-pane-content';
import './show-pane-content';

import './index.styl';

export class BuilderPane extends Pane {
  get eventPaneContent() {
    return {
      tag: 'event-pane-content',
      constants: {
        header: 'Show',
      },
    };
  }

  get filterPropertyValuePaneContent() {
    return {
      tag: 'filter-property-value-pane-content',
      constants: {
        search: false,
        commitLabel: 'Update',
      },
      helpers: {
        commitHandler: () => this.app.commitStageClause(),
        getHeader: () => {
          const clause = this.app.activeStageClause;
          return clause && clause.value ? renameProperty(clause.value) : '';
        },
      },
    };
  }

  get groupPropertyPaneContent() {
    return {
      tag: 'group-property-pane-content',
      constants: {
        header: 'Properties',
      },
    };
  }

  get showPaneContent() {
    return {
      tag: 'show-pane-content',
      constants: {
        header: 'Show',
      },
    };
  }
}

document.registerElement('operator-dropdown', class extends Dropdown {
  get choices() {
    const clause = this.app.activeStageClause;
    return clause ? FilterClause.FILTER_OPERATORS[clause.filterType] : [];
  }

  get selected() {
    return this.app.hasStageClause() ? this.app.activeStageClause.filterOperator : null;
  }

  get isOpen() {
    return this.app.hasStageClause() && this.app.activeStageClause.isEditingFilterOperator;
  }

  toggleOpen() {
    const clause = this.app.activeStageClause;
    this.app.updateStageClause({
      editing: clause && clause.isEditingFilterOperator ? null : 'filterOperator',
    });
  }

  select(filterOperator) {
    this.app.updateStageClause({
      filterOperator,
      filterValue: null,
      filterSearch: null,
      editing: null,
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
    return this.app.hasStageClause() && this.app.activeStageClause.filterDateUnit;
  }

  get isOpen() {
    return this.app.hasStageClause() && this.app.activeStageClause.isEditingFilterDateUnit;
  }

  toggleOpen() {
    const clause = this.app.activeStageClause;
    this.app.updateStageClause({
      editing: clause && clause.isEditingFilterDateUnit ? null : 'filterDateUnit',
    });
  }

  select(filterDateUnit) {
    this.app.updateStageClause({
      filterDateUnit,
      editing: null,
    });
  }
});

document.registerElement('operator-toggle', class extends Toggle {
  get choices() {
    const clause = this.app.activeStageClause;
    return clause ? FilterClause.FILTER_OPERATORS[clause.filterType] : [];
  }

  get selected() {
    return this.app.hasStageClause() && this.app.activeStageClause.filterOperator;
  }

  select(filterOperator) {
    this.app.updateStageClause({filterOperator});
  }
});

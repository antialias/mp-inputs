import BaseView from '../base';
import { AddControlView, EditControlView } from './control';
import PaneView from './pane';
import PaneContentView from './pane-content';
import {
  extend,
  renameProperty,
} from '../../util';

import { Clause, FilterClause } from '../../models/clause';

import template from '../templates/builder/filter.jade';
import propertyPaneTemplate from '../templates/builder/property-pane-content.jade';
import propertyValuePaneTemplate from '../templates/builder/property-value-pane-content.jade';

import '../stylesheets/builder/filter.styl';

class FilterPropertyPaneContentView extends PaneContentView {
  get section() {
    return 'filter';
  }

  get TEMPLATE() {
    return propertyPaneTemplate;
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      resourceTypeChoices: Clause.RESOURCE_TYPES,
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      updateClause: (clauseIndex, clauseData) => {
        super.templateHelpers.updateClause(clauseIndex, clauseData);

        // when a property is selected, switch to the property value inner pane
        // - requestAnimationFrame allows the add pane to be re-rendered as an
        //   edit pane, and still show the css animation sliding to the new pane
        window.requestAnimationFrame(() =>
          super.templateHelpers.updateClause(this.app.editingClauseIndex, {paneIndex: 1})
        );
      },
    });
  }
}

class FilterPropertyValuePaneContentView extends PaneContentView {
  get section() {
    return 'filter';
  }

  get TEMPLATE() {
    return propertyValuePaneTemplate;
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      filterTypeChoices: FilterClause.FILTER_TYPES,
      filterOperatorChoices: FilterClause.FILTER_OPERATORS,
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      showPropertyValues: () => this.app.state.editingClause && !this.app.state.editingClause.filterOperatorIsSetOrNotSet,
    });
  }
}

class FilterPaneView extends PaneView {
  get section() {
    return 'filter';
  }

  get VIEWS() {
    return {
      panes: [
        {content: new FilterPropertyPaneContentView(this)},
        {content: new FilterPropertyValuePaneContentView(this)},
      ],
    };
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      panes: [
        {},
        {search: false},
      ],
    });
  }

  getPaneIndex(clauseIndex) {
    const clause = this.app.state.sections.getClause('filter', clauseIndex) || this.app.state.editingClause;
    return clause ? clause.paneIndex : 0;
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      getHeader: paneIndex => paneIndex ? 'Property values' : 'Properties',
      getPaneIndex: clauseIndex => this.getPaneIndex(clauseIndex),
    });
  }
}

class FilterAddControlView extends AddControlView {
  get section() {
    return 'filter';
  }

  get VIEWS() {
    return {
      pane: new FilterPaneView(this),
    };
  }


  get templateConstants() {
    return extend(super.templateConstants, {
      label: 'Filter',
    });
  }
}

class FilterEditControlView extends EditControlView {
  get section() {
    return 'filter';
  }

  get VIEWS() {
    return {
      pane: new FilterPaneView(this),
    };
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      getLabel: clauseIndex => {
        const clause = this.app.state.sections.getClause('filter', clauseIndex);
        const property = renameProperty(clause.value);
        const connector = this.app.state.sections.getClause('filter', clauseIndex).filterOperator;
        const propertyValue = clause.filterOperatorIsSetOrNotSet ? '' : clause.filterValue;

        return [property, connector, propertyValue];
      },
    });
  }
}

export default class FilterView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      addControl: new FilterAddControlView(this),
      editControl: new FilterEditControlView(this),
    };
  }
}

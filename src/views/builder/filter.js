import BaseView from '../base';
import { AddControlView, EditControlView } from './control';
import PaneView from './pane';
import PaneContentView from './pane-content';
import {
  FILTER_NOT_SET,
  FILTER_SET,
  FILTER_TYPES,
  RESOURCE_TYPES,
  SECTION_FILTER,
} from '../../constants';
import {
  extend,
  renameProperty,
} from '../../util';

import template from '../templates/builder/filter.jade';
import filterPropertyPaneContentTemplate from '../templates/builder/filter-property-pane-content.jade';
import filterPropertyValuePaneContentTemplate from '../templates/builder/filter-property-value-pane-content.jade';

import '../stylesheets/builder/filter.styl';

class FilterPropertyPaneContentView extends PaneContentView {
  get section() {
    return SECTION_FILTER;
  }

  get TEMPLATE() {
    return filterPropertyPaneContentTemplate;
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      resourceTypeChoices: Object.values(RESOURCE_TYPES),
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      selectProperty: (clauseIndex, value) => {
        this.templateHelpers.updateClause(clauseIndex, {value});

        // when a property is selected, switch to the property value inner pane
        // - the timeout allows the add pane to be re-rendered as an edit pane,
        //   and still show the css animation sliding to the new pane
        setTimeout(() => {
          let clauseIndex = this.app.state.sections[SECTION_FILTER].indexOf(this.app.state.editing);
          this.templateHelpers.updateClause(clauseIndex, {paneIndex: 1});
        }, 0);
      },
    });
  }
}

class FilterPropertyValuePaneContentView extends PaneContentView {
  get section() {
    return SECTION_FILTER;
  }

  get TEMPLATE() {
    return filterPropertyValuePaneContentTemplate;
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      filterTypeChoices: Object.values(FILTER_TYPES),
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      showPropertyValues: () => this.app.state.editing &&
        this.app.state.editing.filterType !== FILTER_SET &&
        this.app.state.editing.filterType !== FILTER_NOT_SET,
    });
  }
}

class FilterPaneView extends PaneView {
  get section() {
    return SECTION_FILTER;
  }

  get VIEWS() {
    return {
      panes: [
        {content: new FilterPropertyPaneContentView(this)},
        {content: new FilterPropertyValuePaneContentView(this)},
      ],
    };
  }

  getPaneIndex(clauseIndex) {
    const clause = this.app.clauseAt(SECTION_FILTER, clauseIndex);
    return clause ? clause.paneIndex : 0;
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      getHeader: paneIndex => paneIndex ? 'Property values' : 'Properties',
      getPaneIndex: clauseIndex => this.getPaneIndex(clauseIndex),
      updatePaneIndex: (clauseIndex, paneIndex) =>
        this.app.updateClause(SECTION_FILTER, clauseIndex, {paneIndex}),
    });
  }
}

class FilterAddControlView extends AddControlView {
  get section() {
    return SECTION_FILTER;
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
    return SECTION_FILTER;
  }

  get VIEWS() {
    return {
      pane: new FilterPaneView(this),
    };
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      getLabel: clauseIndex => {
        const clause = this.app.clauseAt(SECTION_FILTER, clauseIndex);
        const showValue = clause.filterType !== FILTER_SET && clause.filterType !== FILTER_NOT_SET;
        return [renameProperty(clause.value), showValue ? clause.filterValue : ''];
      },
      getLabelConnector: clauseIndex => ` ${this.app.clauseAt(SECTION_FILTER, clauseIndex).filterType} `,
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

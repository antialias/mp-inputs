// "Group by" controls for segmenting

import { Component } from 'panel';

import { extend, renameProperty } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { Clause, ShowClause } from '../../../models/clause';
import { Pane, PaneContent } from '../../pane';

import template from './index.jade';
import propertyPaneContentTemplate from '../controls/property-pane-content.jade';
import './index.styl';

document.registerElement('builder-group', class extends Component {
  get config() {
    return {
      template,

      helpers: {
        isDisabled: () => {
          const showValues = this.state.sections.show.clauses.map(clause => clause.value);
          return showValues.length > 1 || showValues.indexOf(ShowClause.TOP_EVENTS) !== -1;
        },
      },
    };
  }
});

// controls
document.registerElement('group-add-control', class extends AddControl {
  get constants() {
    return extend(super.constants, {
      label: 'Group',
    });
  }

  get section() {
    return 'group';
  }
});

document.registerElement('group-edit-control', class extends EditControl {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        getLabel: () =>
          renameProperty(this.state.sections.getClause('group', this.clauseIndex).value),
      }),
    });
  }

  get section() {
    return 'group';
  }
});

// dropdown content
document.registerElement('group-pane', class extends Pane {
  get constants() {
    return extend(super.constants, {
      header: 'Properties',
    });
  }

  get section() {
    return 'group';
  }
});

document.registerElement('group-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: propertyPaneContentTemplate,

      helpers: extend(super.config.helpers, {
        selectProperty: (property, closePane) =>
          this.config.helpers.updateStageClause({value: property.name}, closePane),
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      resourceTypeChoices: Clause.RESOURCE_TYPES,
    });
  }

  get section() {
    return 'group';
  }
});

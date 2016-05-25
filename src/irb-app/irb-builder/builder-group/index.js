// "Group by" controls for segmenting

import { Component } from 'panel';

import { extend, renameProperty } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { Clause } from '../../../models/clause';
import { Pane, PaneContent } from '../../pane';

import template from './index.jade';
import propertyPaneContentTemplate from '../controls/property-pane-content.jade';
import './index.styl';

document.registerElement('builder-group', class extends Component {
  get config() {
    return {template};
  }
});

// controls
document.registerElement('group-add-control', class extends AddControl {
  get section() {
    return 'group';
  }

  get label() {
    return 'Group by';
  }
});

document.registerElement('group-edit-control', class extends EditControl {
  get section() {
    return 'group';
  }

  get label() {
    return renameProperty(this.state.sections.getClause('group', this.clauseIndex).value);
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

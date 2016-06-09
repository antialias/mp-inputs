// "Group by" controls for segmenting

import { Component } from 'panel';

import { renameProperty } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { BuilderPane, PropertyPaneContent, PropertyValuePaneContent } from '../controls/builder-pane';

import template from './index.jade';
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
    const clause = this.state.sections.getClause('group', this.clauseIndex);
    return clause && renameProperty(clause.value);
  }
});

// dropdown content
document.registerElement('group-pane', class extends BuilderPane {
  get section() {
    return 'group';
  }

  get subpanes() {
    return [
      {
        tag: 'group-property-pane-content',
        constants: {
          header: 'Properties',
        },
      },
      {
        tag: 'group-property-value-pane-content',
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
      },
    ];
  }
});

document.registerElement('group-property-pane-content', class extends PropertyPaneContent {

  get section() {
    return 'group';
  }

});


document.registerElement('group-property-value-pane-content', class extends PropertyValuePaneContent {

  get section() {
    return 'group';
  }

});

// "Group by" controls for segmenting

import { Component } from 'panel';

import { renameProperty } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { BuilderPane } from '../controls/builder-pane';

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
      this.groupPropertyPaneContent,
      this.filterPropertyValuePaneContent,
    ];
  }
});

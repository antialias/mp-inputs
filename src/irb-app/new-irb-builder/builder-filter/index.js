// "Filter" controls

import { Component } from 'panel';

import { AddControl, EditControl } from '../controls';

import template from './index.jade';
import './index.styl';

document.registerElement(`query-builder-filter`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
      },
    };
  }
});

// controls
document.registerElement(`builder-filter-add-control`, class extends AddControl {
  get section() {
    return `filter`;
  }

  get label() {
    return `Filter`;
  }

  openPane() {
    super.openPane();
    this.app.startBuilderOnScreen(`builder-screen-filter-properties`);
  }
});

document.registerElement(`builder-filter-edit-control`, class extends EditControl {
  get section() {
    return `filter`;
  }

  get label() {
    return `TODO`;
  }

  openPane() {
    super.openPane();
    this.app.startBuilderOnScreen(`builder-screen-filter-properties`);
  }
});

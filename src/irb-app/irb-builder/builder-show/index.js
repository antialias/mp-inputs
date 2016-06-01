import { Component } from 'panel';

import { capitalize, extend, renameEvent } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { Clause, ShowClause } from '../../../models/clause';
import { Pane, PaneContent } from '../../pane';

import template from './index.jade';
import showPaneContentTemplate from '../controls/show-pane-content.jade';
import './index.styl';

document.registerElement('builder-show', class extends Component {
  get config() {
    return {template};
  }
});

// controls
document.registerElement('show-add-control', class extends AddControl {
  get section() {
    return 'show';
  }

  get label() {
    return 'Compare';
  }
});

document.registerElement('show-edit-control', class extends EditControl {
  shouldUpdate(state) {
    return !!state.sections.getClause('show', this.clauseIndex);
  }

  get section() {
    return 'show';
  }

  get label() {
    const clause = this.state.sections.getClause('show', this.clauseIndex);
    const math = capitalize(clause.math);
    return [math, ' number of ', renameEvent(clause.value)];
  }

  get isRemoveable() {
    return this.state.sections.show.clauses.length > 1;
  }
});

// dropdown content
document.registerElement('show-pane', class extends Pane {
  get constants() {
    return extend(super.constants, {
      header: 'Show',
    });
  }

  get section() {
    return 'show';
  }
});

document.registerElement('show-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: showPaneContentTemplate,
    });
  }

  get constants() {
    return extend(super.constants, {
      mathChoices: ShowClause.MATH_TYPES,
      eventChoices: [ShowClause.TOP_EVENTS, ...this.state.topEvents],
    });
  }

  get section() {
    return 'show';
  }

  get resourceTypeChoices() {
    return Clause.RESOURCE_TYPES;
  }
});

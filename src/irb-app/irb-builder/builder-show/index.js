import { Component } from 'panel';

import { capitalize, extend, renameEvent } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { Clause, ShowClause } from '../../../models/clause';
import { Pane, PaneContent } from '../../pane';

import template from './index.jade';
import showPaneContentTemplate from './show-pane-content.jade';
import './index.styl';

document.registerElement('builder-show', class extends Component {
  get config() {
    return {template};
  }
});

document.registerElement('show-add-control', class extends AddControl {
  get constants() {
    return extend(super.constants, {
      label: 'Compare',
    });
  }

  get section() {
    return 'show';
  }
});

document.registerElement('show-edit-control', class extends EditControl {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        getLabel: () => {
          const clause = this.app.state.sections.getClause('show', this.clauseIndex);
          const math = capitalize(clause.math);
          return [math, ' number of ', renameEvent(clause.value)];
        },
      }),
    });
  }

  get section() {
    return 'show';
  }
});

document.registerElement('show-pane', class extends Pane {
  get constants() {
    return extend(super.constants, {
      hasContent: true,
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
      resourceTypeChoices: Clause.RESOURCE_TYPES,
      eventChoices: [ShowClause.TOP_EVENTS, ...this.state.topEvents],
    });
  }

  get section() {
    return 'show';
  }
});

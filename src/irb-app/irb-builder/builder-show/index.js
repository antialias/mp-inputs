import { Component } from 'panel';

import { capitalize, extend, renameEvent } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { Pane } from '../../pane';
// import PaneView from './pane';
// import PaneContentView from './pane-content';

// import { Clause, ShowClause } from '../../../models/clause';

import template from './index.jade';
// import showPaneContentTemplate from '../templates/builder/show-pane-content.jade';
import './index.styl';

document.registerElement('builder-show', class extends Component {
  get config() {
    return {template};
  }
});

document.registerElement('show-add-control', class extends AddControl {
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
      header: 'Show',
    });
  }

  get section() {
    return 'show';
  }

//   get VIEWS() {
//     return {
//       content: new ShowPaneContentView(this),
//     };
//   }
});

// class ShowPaneContentView extends PaneContentView {
//   get section() {
//     return 'show';
//   }

//   get TEMPLATE() {
//     return showPaneContentTemplate;
//   }

//   get templateConstants() {
//     return extend(super.templateConstants, {
//       mathChoices: ShowClause.MATH_TYPES,
//       resourceTypeChoices: Clause.RESOURCE_TYPES,
//       eventChoices: [ShowClause.TOP_EVENTS, ...this.app.state.topEvents],
//     });
//   }
// }

import { Component } from 'panel';

import { capitalize, extend, renameEvent } from '../../../util';

import { EditControl } from '../controls';
// import { AddControl, EditControl } from '../controls';
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

document.registerElement('show-edit-control', class extends EditControl {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        getLabel: clauseIndex => {
          const clause = this.app.state.sections.getClause('show', clauseIndex);
          const math = capitalize(clause.math);
          return [math, ' number of ', renameEvent(clause.value)];
        },
      }),
    });
  }

  get section() {
    return 'show';
  }

  get clauseIndex() {
    return Number(this.getAttribute('clause-index'));
  }

//   get VIEWS() {
//     return {
//       pane: new ShowPaneView(this),
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

// class ShowPaneView extends PaneView {
//   get section() {
//     return 'show';
//   }

//   get templateConstants() {
//     return extend(super.templateConstants, {
//       header: 'Show',
//     });
//   }

//   get VIEWS() {
//     return {
//       content: new ShowPaneContentView(this),
//     };
//   }
// }

// class ShowAddControlView extends AddControlView {
//   get section() {
//     return 'show';
//   }

//   get VIEWS() {
//     return {
//       pane: new ShowPaneView(this),
//     };
//   }

//   get templateConstants() {
//     return extend(super.templateConstants, {
//       label: 'Compare',
//     });
//   }
// }

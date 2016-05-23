// Time controls for setting query date range / unit

import { Component } from 'panel';

import { extend } from '../../../util';

import { EditControl } from '../controls';
// import { TimeClause } from '../../../models/clause';
// import { Pane, PaneContent } from '../../pane';

import template from './index.jade';
// import timePaneContentTemplate from '../controls/time-pane-content.jade';
import './index.styl';

document.registerElement('builder-time', class extends Component {
  get config() {
    return {template};
  }
});

document.registerElement('time-edit-control', class extends EditControl {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        getLabel: () => {
          const clause = this.state.sections.time.clauses[0];
          const range = clause.range;
          if (range) {
            return range;
          } else {
            throw new Error('Custom ranges not implemented yet');
          }
        },
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      showRemove: false,
    });
  }

  get section() {
    return 'time';
  }
});

// document.registerElement('time-pane', class extends Pane {
//   get constants() {
//     return extend(super.constants, {
//       hasContent: true,
//       header: 'Show',
//     });
//   }

//   get section() {
//     return 'time';
//   }
// });

// document.registerElement('time-pane-content', class extends PaneContent {
//   get config() {
//     return extend(super.config, {
//       template: timePaneContentTemplate,
//     });
//   }

//   get constants() {
//     return extend(super.constants, {
//       mathChoices: ShowClause.MATH_TYPES,
//       resourceTypeChoices: Clause.RESOURCE_TYPES,
//       eventChoices: [ShowClause.TOP_EVENTS, ...this.state.topEvents],
//     });
//   }

//   get section() {
//     return 'time';
//   }
// });

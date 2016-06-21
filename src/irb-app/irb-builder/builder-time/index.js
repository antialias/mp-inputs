// Time controls for setting query date range / unit

import { Component } from 'panel';

import { extend } from '../../../util';

import { EditControl } from '../controls';
import { TimeClause } from '../../../models/clause';
import { Pane, PaneContent } from '../../pane';

import template from './index.jade';
import timePaneContentTemplate from './time-pane-content.jade';
import customDatePaneContentTemplate from './custom-date-pane-content.jade';
import './index.styl';

document.registerElement('builder-time', class extends Component {
  get config() {
    return {template};
  }
});

// controls
document.registerElement('time-edit-control', class extends EditControl {
  get label() {
    const clause = this.state.sections.time.clauses[0];
    const range = clause.range;
    if (range) {
      return range;
    } else {
      throw new Error('Custom ranges not implemented yet');
    }
  }

  get isRemoveable() {
    return false;
  }

  get section() {
    return 'time';
  }
});

// dropdown content
document.registerElement('time-pane', class extends Pane {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        backButtonHandler: () => {
          window.requestAnimationFrame(() =>{
            this.app.updateStageClause({paneIndex: 0});
          });
        },
        commitHandler: () => console.log('COMMITTTT'),
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      header: 'Time',
      search: false,
    });
  }

  get section() {
    return 'time';
  }

  get subpanes() {
    return [
      {
        tag: 'time-pane-content',
      },
      {
        tag: 'custom-date-pane-content',
        constants: {
          commitLabel: 'Update',
          header: 'Custom date range',
        },
      },
    ];
  }
});

document.registerElement('time-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: timePaneContentTemplate,

      helpers: extend(super.config.helpers, {
        selectTimeRange: range => {
          if (range === this.constants.customRange) {
            window.requestAnimationFrame(() => {
              this.app.updateStageClause({paneIndex: 1});
            });
          } else {
            this.app.updateStageClause({range});
            this.app.commitStageClause();
          }
        },
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      rangeChoices: TimeClause.RANGE_CHOICES,
      customRange: TimeClause.RANGES.CUSTOM,
    });
  }

  get section() {
    return 'time';
  }
});

document.registerElement('custom-date-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: customDatePaneContentTemplate,

      helpers: extend(super.config.helpers, {
      }),
    });
  }

  get section() {
    return 'time';
  }
});

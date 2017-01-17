// Time controls for setting query date range / unit

import moment from 'moment';
import { Component } from 'panel';

import { extend } from '../../../util';

import { EditControl } from '../controls';
import { TimeClause } from '../../../models/clause';
import { Pane, PaneContent } from '../../pane';

import template from './index.jade';
import timePaneContentTemplate from './time-pane-content.jade';
import customDatePaneContentTemplate from './custom-date-pane-content.jade';
import './index.styl';

document.registerElement(`builder-time`, class extends Component {
  get config() {
    return {template};
  }
});

// controls
document.registerElement(`time-edit-control`, class extends EditControl {
  get label() {
    const clause = this.state.report.sections.time.clauses[0];
    return clause.range ? clause.range : `${clause.value[0]} - ${clause.value[1]}`;
  }

  get isRemoveable() {
    return false;
  }

  get section() {
    return `time`;
  }
});

// dropdown content
document.registerElement(`time-pane`, class extends Pane {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        backButtonHandler: () => {
          window.requestAnimationFrame(() =>{
            this.app.updateStageClause({paneIndex: 0});
          });
        },
        commitHandler: () => this.app.activeStageClause.valid && this.app.commitStageClause(),
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      header: `Time`,
      search: false,
    });
  }

  get section() {
    return `time`;
  }

  get subpanes() {
    return [
      {
        tag: `time-pane-content`,
      },
      {
        tag: `custom-date-pane-content`,
        constants: {
          commitLabel: `Update`,
          header: `Custom date range`,
        },
      },
    ];
  }
});

document.registerElement(`time-pane-content`, class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: timePaneContentTemplate,

      helpers: extend(super.config.helpers, {
        isRangeSelected: range => {
          const selectedRange = this.helpers.getActiveClauseProperty(`range`);
          return range === selectedRange || (!selectedRange && range === this.constants.customRange);
        },
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
      rangeChoices: TimeClause.RANGE_LIST,
      customRange: TimeClause.RANGES.CUSTOM,
    });
  }

  get section() {
    return `time`;
  }
});

document.registerElement(`custom-date-pane-content`, class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: customDatePaneContentTemplate,

      helpers: extend(super.config.helpers, {
        selectUnit: unit => this.app.updateStageClause({unit, paneIndex: 1}),
        selectDateRange: ev => {
          if (ev.detail) {
            let unit = this.helpers.getActiveClauseProperty(`unit`);
            const currentVal = this.helpers.getActiveClauseProperty(`value`);
            if (
              !Array.isArray(currentVal) ||
              currentVal[0] !== ev.detail[0] ||
              currentVal[1] !== ev.detail[1]
            ) {
              // auto-adjust unit when changing date range
              const [start, end] = ev.detail.map(ds => moment.utc(ds));
              const days = end.diff(start, `days`) + 1;
              if (days <= 4) {
                unit = `hour`;
              } else if (days <= 31) {
                unit = `day`;
              } else if (days <= 183) {
                unit = `week`;
              } else {
                unit = `month`;
              }
            }

            this.app.updateStageClause({paneIndex: 1, range: null, unit, value: ev.detail});
          }
        },
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      unitChoices: TimeClause.UNIT_LIST.filter(choice => choice !== `year`),
    });
  }

  get section() {
    return `time`;
  }
});

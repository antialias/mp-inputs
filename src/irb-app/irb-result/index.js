import { Component } from 'panel';

import Toggle from '../widgets/toggle';

import './bar-chart';
import './line-chart';
import './table-chart';

import template from './index.jade';
import './index.styl';

const CHART_TYPES = ['bar', 'line', 'table'];

document.registerElement('irb-result', class extends Component {
  get config() {
    return {template};
  }
});

document.registerElement('chart-toggle', class extends Toggle {
  get choices() {
    return CHART_TYPES;
  }

  formatChoiceClass(choice) {
    return `chart-type-${choice}`;
  }

  select(chartType) {
    if (chartType === 'table') { return; } // TODO: remove when we add pivot table
    this.app.update({chartType});
  }

  get selected() {
    return this.state.chartType;
  }
});

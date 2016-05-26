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
    this.update({chartType});
  }

  get selected() {
    return this.state.chartType;
  }
});

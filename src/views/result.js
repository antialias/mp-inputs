import BaseView from './base';
import ToggleView from './widgets/toggle';
import BarChartView from './charts/bar';
import LineChartView from './charts/line';
import TableChartView from './charts/table';

import template from './templates/result.jade';
import './stylesheets/result.styl';

const CHART_TYPES = ['bar', 'line', 'table'];

class ChartToggleView extends ToggleView {
  get choices() {
    return CHART_TYPES;
  }

  get selected() {
    return this.app.state.chartType;
  }

  select(chartType) {
    this.app.update({chartType});
  }

  formatChoiceClass(choice) {
    return `chart-type-${choice}`;
  }
}

export default class ResultView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      chartToggle: new ChartToggleView(this),
      charts: {
        bar: new BarChartView(this),
        line: new LineChartView(this),
        table: new TableChartView(this),
      },
    }
  }
}

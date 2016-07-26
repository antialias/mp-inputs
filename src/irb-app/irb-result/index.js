import { Component } from 'panel';
import { filterObjectAtDepth } from './chart-util';

import { extend, pick, renameEvent } from '../../util';

import './bar-chart';
import './line-chart';
import './table-chart';
import './chart-controls';
import './mp-toast';

import template from './index.jade';
import './index.styl';

const ANALYSIS_CHART_TABLE = {
  Bar: {
    linear: true,
    logarithmic: true,
    rolling: false,
    cumulative: false,
  },
  Line: {
    linear: true,
    logarithmic: true,
    rolling: true,
    cumulative: true,
  },
  Table: {
    linear: true,
    logarithmic: false,
    rolling: false,
    cumulative: false,
  },
  'Stacked bar': {
    linear: true,
    logarithmic: true,
    rolling: false,
    cumulative: false,
  },
  'Stacked line': {
    linear: true,
    logarithmic: true,
    rolling: true,
    cumulative: true,
  },
};
const VALUE_CHART_TABLE = {
  Bar: false,
  Line: false,
  Table: false,
  'Stacked bar': true,
  'Stacked line': true,
};

const CHART_OPTIONS = {
  bar: {
    standard: 'Bar',
    stacked: 'Stacked bar',
  },
  line: {
    standard: 'Line',
    stacked: 'Stacked line',
  },
  table: {
    standard: 'Table',
  },
};

document.registerElement('irb-result', class extends Component {
  get config() {
    return {
      helpers: {
        getBoundaries: () => pick(this.getBoundingClientRect(), ['top', 'left']),
        getChartOptions: () => pick(this.state.report.displayOptions, ['plotStyle']),
        getShowValueNames: () => this.state.report.sections.show.clauses.map(clause => renameEvent(clause.value.name)),
        getUniqueShowMathTypes: () => new Set(this.state.report.sections.show.clauses.map(clause => clause.math)),
        toastClosed: () => this.update({newCachedData: false}),
        toastSelected: () => this.app.query(),
        filterResults: (result, depth=2) => ({
          headers: result.headers,
          series: filterObjectAtDepth(
            result.series, series => this.state.report.series.data[series], depth
          ),
        }),
      },
      template,
    };
  }

  formattedChartName(type, style) {
    return CHART_OPTIONS[type][style];
  }

  selectedChartName() {
    return this.formattedChartName(this.state.report.displayOptions.chartType, this.state.report.displayOptions.plotStyle);
  }

  styleChoicesForChartType(type) {
    return Object.keys(CHART_OPTIONS[type]);
  }

  isAnalysisEnabled(analysis, chartName=this.selectedChartName()) {
    return ANALYSIS_CHART_TABLE[chartName][analysis];
  }

  isValueToggleEnabled(chartName=this.selectedChartName()) {
    return VALUE_CHART_TABLE[chartName];
  }

  updateDisplayOpitons(displayOptions) {
    const options = extend(this.state.report.displayOptions, displayOptions);

    const chartToggle = extend(this.state.chartToggle, {editingType: null});
    chartToggle[options.chartType].plotStyle = options.plotStyle;
    this.app.updateChartToggle(chartToggle);

    const newChartName = this.formattedChartName(options.chartType, options.plotStyle);

    this.app.updateDisplayOpitons(extend(options, {
      analysis: this.isAnalysisEnabled(options.analysis, newChartName) ? options.analysis : 'linear',
      value: this.isValueToggleEnabled(newChartName) ? options.value : 'absolute',
    }));
  }
});

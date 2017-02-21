import { Component } from 'panel';

import { formattedChartName } from './chart-util';
import { extend } from '../../util';

import './chart-controls';
import './chart-display';

import template from './index.jade';
import './index.styl';

const AVAILABLE_ANALYSES = {
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
const VALUE_TOGGLE_AVAILABLE = {
  Bar: true,
  Line: false,
  Table: true,
  'Stacked bar': true,
  'Stacked line': true,
};

document.registerElement(`irb-result`, class extends Component {
  get config() {
    return {
      template,
    };
  }

  isAnalysisEnabled(analysis, chartName=this.selectedChartName()) {
    return AVAILABLE_ANALYSES[chartName][analysis];
  }

  isValueToggleEnabled(chartName=this.selectedChartName()) {
    return VALUE_TOGGLE_AVAILABLE[chartName];
  }

  // TODO just put this in state
  selectedChartName() {
    return formattedChartName(this.state.report.displayOptions.chartType, this.state.report.displayOptions.plotStyle);
  }

  updateDisplayOptions(displayOptions) {
    const options = extend(this.state.report.displayOptions, displayOptions);

    const chartToggle = extend(this.state.chartToggle, {editingType: null});
    chartToggle[options.chartType].plotStyle = options.plotStyle;
    this.app.updateChartToggle(chartToggle);

    const newChartName = formattedChartName(options.chartType, options.plotStyle);

    this.app.updateDisplayOptions(extend(options, {
      analysis: this.isAnalysisEnabled(options.analysis, newChartName) ? options.analysis : `linear`,
      value: this.isValueToggleEnabled(newChartName) ? options.value : `absolute`,
    }));
  }
});

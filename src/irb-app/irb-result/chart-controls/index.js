import { Component } from 'panel';

import { extend, pick } from '../../../util';

import template from './index.jade';
import chartToggleTemplate from './chart-toggle.jade';
import extrasMenuTemplate from './extras-menu.jade';
import './index.styl';

const ANALYSIS_CHOICES = ['linear', 'rolling', 'logarithmic', 'cumulative'];
const VALUE_CHOICES = ['absolute', 'relative'];

document.registerElement('chart-toggle', class extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, 'stopEditingChartToggle');
    const chartType = this.state.report.displayOptions.chartType;
    const chartOptions = extend(this.state.chartToggle[chartType], pick(this.state.report.displayOptions, ['plotStyle']));
    this.app.updateChartToggle({[chartType]: chartOptions});
  }

  get config() {
    return {
      template: chartToggleTemplate,
      helpers: {
        chartTypes: () => ['bar', 'line', 'table'],
        formattedChartName: (type, style) => this.IRBResult.formattedChartName(type, style),
        selectedPlotStyle: type => this.state.chartToggle[type].plotStyle,
        styleChoicesForChartType: type => this.IRBResult.styleChoicesForChartType(type),
        onDropdownClick: editingType => this.app.updateChartToggle({editingType}),
        onStyleClick: (chartType, plotStyle) => {
          const displayOptions = this.state.report.displayOptions;
          if (displayOptions.chartType !== chartType || displayOptions.plotStyle !== plotStyle) {
            this.app.trackWithReportInfo('Chart Options - Changed Chart Type', {
              'new chart type': chartType,
              'new plot style': plotStyle,
            });
          }
          this.IRBResult.updateDisplayOptions({chartType, plotStyle})
        },
      },
    };
  }

  get IRBResult() {
    this._IRBResult = this._IRBResult || this.findPanelParentByTagName('irb-result');
    return this._IRBResult;
  }
});

document.registerElement('extras-menu', class extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, 'stopEditingExtrasMenu');
  }

  get config() {
    return {
      template: extrasMenuTemplate,

      helpers: {
        analysisChoices: () => ANALYSIS_CHOICES,
        valueChoices: () => VALUE_CHOICES,
        isAnalysisDisabled: analysis => !this.IRBResult.isAnalysisEnabled(analysis),
        isValueToggleDisabled: () => !this.IRBResult.isValueToggleEnabled(),
        startEditingExtrasMenu: () => this.update({isEditingExtrasMenu: true}),
        onAnalysisClick: analysis => {
          this.app.trackWithReportInfo('Chart Options - Changed Analysis', {'new analysis type': analysis});
          this.IRBResult.updateDisplayOptions({analysis});
        },
        onValueClick: value => {
          this.app.trackWithReportInfo('Chart Options - Changed Value Display', {'new analysis type': value});
          this.IRBResult.updateDisplayOptions({value});
        },
      },
    };
  }

  get IRBResult() {
    this._IRBResult = this._IRBResult || this.findPanelParentByTagName('irb-result');
    return this._IRBResult;
  }
});

document.registerElement('chart-controls', class extends Component {
  get config() {
    return extend(super.config, {template});
  }
});

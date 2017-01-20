import { Component } from 'panel';

import { formattedChartName, styleChoicesForChartType } from '../../chart-util';
import { Clause } from '../../../../models/clause';
import { extend, pick } from '../../../../util';

import template from './index.jade';
import './index.styl';

const BAR_CHART = `bar`;
const LINE_CHART = `line`;
const TABLE_CHART = `table`;

document.registerElement(`chart-toggle`, class extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, `stopEditingChartToggle`);
    const chartType = this.state.report.displayOptions.chartType;
    const chartOptions = extend(this.state.chartToggle[chartType], pick(this.state.report.displayOptions, [`plotStyle`]));
    this.app.updateChartToggle({[chartType]: chartOptions});
  }

  get config() {
    return {
      template,
      helpers: {
        formattedChartName,
        styleChoicesForChartType,
        chartTypes: () => [BAR_CHART, LINE_CHART, TABLE_CHART],
        isChartTypeDisabled: type => this.isChartTypeDisabled(type),
        selectedPlotStyle: type => this.state.chartToggle[type].plotStyle,
        menuChange: (ev, type) => (type === this.state.chartToggle.editingType && ev.detail && ev.detail.state === `closed` && this.app.stopEditingChartToggle()),
        onDropdownClick: type => {
          if (this.app.state.projectHasEvents && !this.isChartTypeDisabled(type)) {
            this.app.updateChartToggle({
              editingType: this.state.chartToggle.editingType === type ? null : type,
            });
          }
        },
        onStyleClick: (chartType, plotStyle) => {
          if (this.app.state.projectHasEvents && !this.isChartTypeDisabled(chartType)) {
            const reportTrackingData = this.state.report.toTrackingData();
            const displayOptions = this.state.report.displayOptions;
            this.IRBResult.updateDisplayOptions({chartType, plotStyle});
            if (displayOptions.chartType !== chartType || displayOptions.plotStyle !== plotStyle) {
              this.app.trackEvent(
                `Chart Options - Changed Chart Type`,
                extend(reportTrackingData, {
                  'new chart type': chartType,
                  'new plot style': plotStyle,
                })
              );
            }
          }
        },
      },
    };
  }

  isChartTypeDisabled(type) {
    const disabledChartTypes = new Set();
    if (this.state.report.sections.show.clauseResourceTypes() === Clause.RESOURCE_TYPE_PEOPLE) {
      disabledChartTypes.add(LINE_CHART);
    }
    return disabledChartTypes.has(type);
  }

  get IRBResult() {
    this._IRBResult = this._IRBResult || this.findPanelParentByTagName(`irb-result`);
    return this._IRBResult;
  }
});

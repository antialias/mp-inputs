import { Component } from 'panel';

import { formattedChartName, styleChoicesForChartType } from '../chart-util';
import { Clause } from '../../../models/clause';
import { extend, pick } from '../../../util';

import template from './index.jade';
import chartToggleTemplate from './chart-toggle.jade';
import extrasMenuTemplate from './extras-menu.jade';
import './index.styl';

const ANALYSIS_LIST = [`linear`, `rolling`, `logarithmic`, `cumulative`];
const VALUE_LIST = [`absolute`, `relative`];
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
      template: chartToggleTemplate,
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

document.registerElement(`extras-menu`, class extends Component {
  get config() {
    return {
      template: extrasMenuTemplate,

      helpers: {
        analysisChoices: () => ANALYSIS_LIST,
        valueChoices: () => VALUE_LIST,
        isAnalysisDisabled: analysis => !this.IRBResult.isAnalysisEnabled(analysis),
        isValueToggleDisabled: () => !this.IRBResult.isValueToggleEnabled(),
        menuChange: ev => ev.detail && ev.detail.state === `closed` && this.app.stopEditingExtrasMenu(),
        onClickExtrasMenu: () => this.update({isEditingExtrasMenu: !this.state.isEditingExtrasMenu}),
        onAnalysisClick: analysis => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.IRBResult.updateDisplayOptions({analysis});
          this.app.stopEditingExtrasMenu();
          this.app.trackEvent(
            `Chart Options - Changed Analysis`,
            extend(reportTrackingData, {'new analysis type': analysis})
          );
        },
        onValueClick: value => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.IRBResult.updateDisplayOptions({value});
          this.app.stopEditingExtrasMenu();
          this.app.trackEvent(
            `Chart Options - Changed Value Display`,
            extend(reportTrackingData, {'new analysis type': value})
          );
        },
      },
    };
  }

  get IRBResult() {
    this._IRBResult = this._IRBResult || this.findPanelParentByTagName(`irb-result`);
    return this._IRBResult;
  }
});

document.registerElement(`chart-controls`, class extends Component {
  get config() {
    return extend(super.config, {template});
  }
});

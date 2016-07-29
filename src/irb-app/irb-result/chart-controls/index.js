import { Component } from 'panel';
import { Pane, PaneContent } from '../../pane';

import { extend, pick } from '../../../util';
import { renameEvent, renamePropertyValue } from '../../../util';

import template from './index.jade';
import chartToggleTemplate from './chart-toggle.jade';
import extrasMenuTemplate from './extras-menu.jade';
import showHideSeriesTemplate from './show-hide-series.jade';
import showHideSeriesPaneContentTemplate from './show-hide-series-pane-content.jade';
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
        onStyleClick: (chartType, plotStyle) => this.IRBResult.updateDisplayOptions({chartType, plotStyle}),
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
        onAnalysisClick: analysis => this.IRBResult.updateDisplayOptions({analysis}),
        onValueClick: value => this.IRBResult.updateDisplayOptions({value}),
      },
    };
  }

  get IRBResult() {
    this._IRBResult = this._IRBResult || this.findPanelParentByTagName('irb-result');
    return this._IRBResult;
  }
});

document.registerElement('show-hide-series-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: showHideSeriesPaneContentTemplate,

      helpers: extend(super.config.helpers, {
        isSeriesShowing: name => this.state.report.series.data[name],
        renameSeries: name => this.state.report.series.currentSeries === '$event' ? renameEvent(name) : renamePropertyValue(name),
        matchesSearch: value => (
          this.state.report.series && (
            !this.state.report.series.search ||
            this.config.helpers.renameSeries(value).toLowerCase().indexOf(this.state.report.series.search.toLowerCase()) === 0
          )
        ),
        resetSeries: () => this.app.updateSeriesState(this.state.report.series.updateSeriesData(this.state.result, false)),
        selectedSeriesCount: () => Object.values(this.state.report.series.data).filter(Boolean).length,
        seriesData: () => Object.keys(this.state.report.series.data).filter(this.config.helpers.matchesSearch).sort(),
        toggleShowSeries: name => {
          const currentData = this.state.report.series.data;
          if (currentData.hasOwnProperty(name)) {
            const newSeriesValue = {};
            newSeriesValue[name] = !currentData[name];
            this.app.updateSeriesState({data: extend(currentData, newSeriesValue)});
          }
        },
        totalSeriesCount: () => Object.keys(this.state.report.series.data).length,
      }),
    });
  }
});

document.registerElement('show-hide-series-pane', class extends Pane {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        searchHandler: ev => {
          this.app.updateSeriesState({search: ev.target.value});
        },
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      header: 'Show | Hide',
    });
  }

  get section() {
    return 'show-hide-series';
  }
});

document.registerElement('show-hide-series', class extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, 'stopEditingSeries');
  }

  get config() {
    return {
      template: showHideSeriesTemplate,

      helpers: {
        startEditingSeries: () => this.app.startEditingSeries(),
      },
    };
  }
});

document.registerElement('chart-controls', class extends Component {
  get config() {
    return extend(super.config, {template});
  }
});

import { Component } from 'panel';
import { Pane, PaneContent } from '../../pane';

import { extend } from '../../../util';
import { renameEvent, renamePropertyValue } from '../../../util';

import template from './index.jade';
import chartToggleTemplate from './chart-toggle.jade';
import showHideSeriesTemplate from './show-hide-series.jade';
import showHideSeriesPaneContentTemplate from './show-hide-series-pane-content.jade';
import './index.styl';

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

document.registerElement('chart-toggle', class extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, 'stopEditingChartStyle');
    this.selectedStyles = {};
    Object.keys(CHART_OPTIONS).forEach(type => {
      if (type == this.state.report.chartOptions.type) {
        this.selectedStyles[type] = this.state.report.chartOptions.style;
      } else {
        this.selectedStyles[type] = Object.keys(CHART_OPTIONS[type])[0];
      }
    });
  }

  get config() {
    return {
      template: chartToggleTemplate,
      helpers: {
        chartTypes: () => Object.keys(CHART_OPTIONS),
        chartTypeStyles: type => Object.keys(CHART_OPTIONS[type]),
        lastSelectedStyle: type => this.selectedStyles && this.selectedStyles[type],
        typeSyleName: (type, style) => CHART_OPTIONS[type][style],
        onTypeClick: type => this.app.updateChartType(type, this.selectedStyles[type]),
        onDropdownClick: type => this.app.updateChartOptions({chartTypeEditing: type}),
        onStyleClick: (type, style) => {
          this.selectedStyles[type] = style;
          this.app.updateChartOptions({type, style, chartTypeEditing: null});
        },
      },
    };
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
        resetSeries: () => this.app.updateSeriesData(this.state.result, false),
        selectedSeriesCount: () => Object.values(this.state.report.series.data).filter(Boolean).length,
        seriesData: () => Object.keys(this.state.report.series.data).filter(this.config.helpers.matchesSearch),
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

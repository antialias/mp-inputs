import { Component } from 'panel';

import * as util from '../../../util';

import template from './index.jade';
import './index.styl';

document.registerElement('chart-legend', class extends Component {
  get config() {
    return {
      template,
      helpers: {
        allSeriesSelected: () => !this.state.report.legend.unselectedCount(),
        isSeriesValueShowing: (seriesIdx, name) => this.state.report.legend.data[seriesIdx].seriesData[name],
        isSearchActive: () => !!this.state.report.legend.search,
        matchesSearch: value => (
          this.state.report.legend && (
            !this.state.report.legend.search ||
            this.config.helpers.renameSeriesValue(value).toLowerCase().indexOf(this.state.report.legend.search.toLowerCase()) === 0
          )
        ),
        renameSeriesValue: (seriesIdx, name) => (
          this.state.report.legend.data[seriesIdx].seriesName === '$event' ? util.renameEvent(name) : util.renamePropertyValue(name)
        ),
        resetLegend: () => {
          this.app.updateLegendState(this.state.report.legend.updateLegendData(this.state.result, !this.config.helpers.allSeriesSelected(), null));
        },
        searchHandler: ev => this.app.updateLegendState({search: ev.target.value}),
        selectedSeriesCount: idx => Object.values(this.state.report.legend.data[idx].seriesData).filter(Boolean).length,
        seriesData: () => Object.keys(this.state.report.legend.data).filter(this.config.helpers.matchesSearch).sort(),
        toggleShowSeriesValue: (seriesIdx, name) => {
          const seriesData = this.state.report.legend.data[seriesIdx].seriesData;
          if (seriesData.hasOwnProperty(name)) {
            const newSeriesValue = {[name]: !seriesData[name]};
            this.app.updateLegendSeriesAtIndex(seriesIdx, newSeriesValue);
          }
        },
        totalSeriesCount: idx => Object.keys(this.state.report.legend.data[idx].seriesData).length,
      },
    };
  }
});

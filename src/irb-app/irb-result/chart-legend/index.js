import { Component } from 'panel';

import * as util from '../../../util';
import { extend } from 'mixpanel-common/util';

import template from './index.jade';
import './index.styl';

document.registerElement('chart-legend', class extends Component {
  get config() {
    return {
      template,
      helpers: {
        allSeriesSelected: () => !this.state.report.legend.unselectedCount(),
        isSeriesShowing: name => this.state.report.legend.data[name],
        isSearchActive: () => !!this.state.report.legend.search,
        matchesSearch: value => (
          this.state.report.legend && (
            !this.state.report.legend.search ||
            this.config.helpers.renameSeriesValue(value).toLowerCase().indexOf(this.state.report.legend.search.toLowerCase()) === 0
          )
        ),
        renameSeriesValue: name => this.state.report.legend.currentSeries === '$event' ? util.renameEvent(name) : util.renamePropertyValue(name),
        resetLegend: () => {
          this.app.updateLegendState(this.state.report.legend.updateLegendData(this.state.result, !this.config.helpers.allSeriesSelected(), null));
        },
        searchHandler: ev => this.app.updateLegendState({search: ev.target.value}),
        selectedSeriesCount: () => Object.values(this.state.report.legend.data).filter(Boolean).length,
        seriesData: () => Object.keys(this.state.report.legend.data).filter(this.config.helpers.matchesSearch).sort(),
        toggleShowSeries: name => {
          const currentData = this.state.report.legend.data;
          if (currentData.hasOwnProperty(name)) {
            const newSeriesValue = {};
            newSeriesValue[name] = !currentData[name];
            this.app.updateLegendState({data: extend(currentData, newSeriesValue)});
          }
        },
        totalSeriesCount: () => Object.keys(this.state.report.legend.data).length,
      },
    };
  }
});

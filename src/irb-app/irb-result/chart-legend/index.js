import { Component } from 'panel';

import * as util from '../../../util';
import { extend } from 'mixpanel-common/util';

import template from './index.jade';
import './index.styl';

document.registerElement('chart-legend', class extends Component {
  get config() {
    return {
      template,
      defaultState: {util},
      helpers: {
        searchHandler: ev => this.app.updateSeriesState({search: ev.target.value}),
        isSeriesShowing: name => this.state.report.series.data[name],
        renameSeriesTitle: name => util.renameProperty(name),
        renameSeriesValue: name => this.state.report.series.currentSeries === '$event' ? util.renameEvent(name) : util.renamePropertyValue(name),
        matchesSearch: value => (
          this.state.report.series && (
            !this.state.report.series.search ||
            this.config.helpers.renameSeries(value).toLowerCase().indexOf(this.state.report.series.search.toLowerCase()) === 0
          )
        ),
        resetSeries: () => this.app.updateSeriesState(this.state.report.series.updateSeriesData(this.state.result, false)),
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
      },
    };
  }
});

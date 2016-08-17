import { Component } from 'panel';

import * as util from '../../../util';

import template from './index.jade';
import './index.styl';

document.registerElement('chart-legend', class extends Component {
  get config() {
    return {
      template,
      helpers: {
        allSeriesSelected: seriesIdx => !this.state.report.legend.unselectedCount(seriesIdx),
        deleteToFilter: (ev, seriesIdx, value) => {
          ev.stopPropagation();
          const groupClauses = this.state.report.sections.group.clauses;
          const groupProperties = util.pick(
            groupClauses[groupClauses.length - seriesIdx - 1],
            ['value', 'filterType', 'resourceType']
          );
          this.app.startAddingClause('filter', util.extend(groupProperties, {
            filterOperator: value === 'null' ? 'is set' : 'does not equal',
            filterValue: [value],
          }));
          this.app.commitStageClause();
        },
        isSeriesValueShowing: (seriesIdx, name) => this.state.report.legend.data[seriesIdx].seriesData[name],
        isSearchActive: () => !!this.state.report.legend.search,
        legendDataToDisplay: () => {
          const seriesData = this.state.report.legend.data.map((series, idx) => {
            const seriesValues = Object.keys(series.seriesData).filter(value => this.config.helpers.matchesSearch(value, idx)).sort();
            if (this.state.report.legend.getSeriesDisplayAtIndex(idx) === 'minimized') {
              seriesValues.splice(12);
            }
            return {seriesName: series.seriesName, seriesValues};
          });
          return seriesData.some(series => series.seriesValues.length) ? seriesData : [];
        },
        matchesSearch: (value, seriesIdx) => (
          this.state.report.legend && (
            !this.state.report.legend.search ||
            this.config.helpers.renameSeriesValue(seriesIdx, value).toLowerCase().indexOf(this.state.report.legend.search.toLowerCase()) === 0
          )
        ),
        renameSeriesValue: (seriesIdx, name) => (
          this.state.report.legend.data[seriesIdx].seriesName === '$event' ? util.renameEvent(name) : util.renamePropertyValue(name)
        ),
        searchHandler: ev => {
          if (ev.target.value) {
            this.state.report.legend.showAllSeries();
          } else {
            this.state.report.legend.setDefaultSeriesShowing();
          }
          this.app.updateLegendState({search: ev.target.value});
        },
        selectedSeriesCount: idx => Object.values(this.state.report.legend.data[idx].seriesData).filter(Boolean).length,
        seriesDisplayOption: idx => {
          let label = null;
          switch (this.state.report.legend.getSeriesDisplayAtIndex(idx)) {
            case 'minimized':
              label = 'More';
              break;
            case 'expanded':
              label = 'Less';
              break;
          }
          return label;
        },
        toggleAllSeriesValue: seriesIdx => {
          const seriesData = this.state.report.legend.data[seriesIdx].seriesData;
          const newValue = !this.config.helpers.allSeriesSelected(seriesIdx);
          Object.keys(seriesData).forEach(key => seriesData[key] = newValue);
          this.app.updateLegendSeriesAtIndex(seriesIdx, seriesData);
        },
        toggleShowSeriesValue: (seriesIdx, name) => {
          const seriesData = this.state.report.legend.data[seriesIdx].seriesData;
          if (seriesData.hasOwnProperty(name)) {
            this.app.updateLegendSeriesAtIndex(seriesIdx, {[name]: !seriesData[name]});
          }
        },
        totalSeriesCount: idx => Object.keys(this.state.report.legend.data[idx].seriesData).length,
      },
    };
  }
});

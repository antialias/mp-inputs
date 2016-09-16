import { Component } from 'panel';

import { mixpanel } from 'tracking';

import {
  extend,
  renameEvent,
  renamePropertyValue,
  stringFilterMatches,
  pick,
  sorted,
} from '../../../util';

import '../../widgets/sticky-scroll';

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
          mixpanel.track('Legend - delete');
          const groupClauses = this.state.report.sections.group.clauses;
          const groupProperties = pick(
            groupClauses[groupClauses.length - seriesIdx - 1],
            ['value', 'filterType', 'resourceType']
          );
          this.app.startAddingClause('filter', extend(groupProperties, {
            filterOperator: value === 'null' ? 'is set' : 'does not equal',
            filterValue: [value],
          }));
          this.app.commitStageClause();
        },
        isAnySeriesLargeSearch: legendData => legendData.some(series => this.config.helpers.isSeriesLargeSearchResult(series)),
        isSeriesLargeSearchResult: series => this.config.helpers.isSearchActive() && series.seriesValues.length > 12,
        isSeriesValueShowing: (seriesIdx, name) => this.state.report.legend.data[seriesIdx].seriesData[name],
        isSearchActive: () => !!this.state.report.legend.search,
        legendDataToDisplay: () => {
          const seriesData = this.state.report.legend.data.map((series, idx) => {
            let seriesValues = Object.keys(series.seriesData)
              .map(text => this.config.helpers.renameSeriesValue(idx, text))
              .map(text => {
                const matches = this.state.report.legend && stringFilterMatches(
                  text, this.state.report.legend.search
                );
                return matches ? {text, matches} : null;
              })
              .filter(Boolean);
            seriesValues = sorted(seriesValues, {
              transform: v => v.text.toLowerCase(),
            });
            if (this.state.report.legend.getSeriesDisplayAtIndex(idx) === 'minimized') {
              seriesValues.splice(12);
            }
            return {seriesName: series.seriesName, seriesValues};
          });
          return seriesData.some(series => series.seriesValues.length) ? seriesData : [];
        },
        renameSeriesValue: (seriesIdx, name) => (
          this.state.report.legend.data[seriesIdx].seriesName === '$event' ? renameEvent(name) : renamePropertyValue(name)
        ),
        searchHandler: ev => {
          if (ev.target.value) {
            this.state.report.legend.showAllSeries();
            if (!this.state.report.legend.search) {
              mixpanel.track('Legend - search');
            }
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
          if (newValue) {
            mixpanel.track('Legend - show all');
          } else {
            mixpanel.track('Legend - hide all');
          }
        },
        toggleShowSeriesValue: (seriesIdx, name) => {
          const seriesData = this.state.report.legend.data[seriesIdx].seriesData;
          if (seriesData.hasOwnProperty(name)) {
            this.app.updateLegendSeriesAtIndex(seriesIdx, {[name]: !seriesData[name]});
            if (seriesData[name]) {
              mixpanel.track('Legend - show');
            } else {
              mixpanel.track('Legend - hide');
            }
          }
        },
        totalSeriesCount: idx => Object.keys(this.state.report.legend.data[idx].seriesData).length,
      },
    };
  }
});

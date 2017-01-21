import { Component } from 'panel';

import {
  extend,
  renameEvent,
  renamePropertyValue,
  stringFilterMatches,
  pick,
  sorted,
} from '../../../../util';
import '../../../widgets/sticky-scroll';

import template from './index.jade';
import './index.styl';

document.registerElement(`chart-legend`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        allSeriesSelected: seriesIdx => !this.state.report.legend.unselectedCount(seriesIdx, this.legendDataKey),
        deleteToFilter: (ev, seriesIdx, value) => {
          ev.stopPropagation();
          const reportTrackingData = this.state.report.toTrackingData();
          const groupClauses = this.state.report.sections.group.clauses;
          const groupProperties = pick(
            groupClauses[groupClauses.length - seriesIdx - 1],
            [`value`, `filterType`, `resourceType`]
          );
          this.app.startAddingClause(`filter`, extend(groupProperties, {
            filterOperator: value === `null` ? `is set` : `does not equal`,
            filterValue: [value],
          }));
          this.app.commitStageClause();
          this.app.trackEvent(
            `Legend - Delete`,
            extend(reportTrackingData, {'deleted value': value.text})
          );
        },
        isAnySeriesLargeSearch: legendData => legendData.some(series => this.helpers.isSeriesLargeSearchResult(series)),
        isFlattenedData: () => this.state.report.displayOptions.chartType === `line`,
        isSeriesLargeSearchResult: series => this.helpers.isSearchActive() && series.seriesValues.length > 12,
        isSeriesValueShowing: (seriesIdx, name) => {
          return this.state.report.legend.data[seriesIdx][this.legendDataKey][name];
        },
        isSearchActive: () => !!this.state.report.legend.search,
        legendDataToDisplay: () => {
          const legend = this.state.report.legend;
          const isFlattenedData = this.helpers.isFlattenedData();
          const data = isFlattenedData ? [legend.data[0]] : legend.data;

          const seriesData = data.map((series, idx) => {
            let seriesValues = Object.keys(series[this.legendDataKey])
              .map(originalValue => {
                let matches = null;
                let formattedText = null;
                if (isFlattenedData) {
                  let dataPath = legend.data[0].flattenedDataPaths[originalValue];
                  formattedText = dataPath.map((value, idx) => this.helpers.renameSeriesValue(dataPath.length - 1 - idx, value));
                  const allMatches = formattedText.map(text => stringFilterMatches(
                    text, legend.search
                  ));
                  if (allMatches.some(Boolean)) {
                    matches = allMatches.map((match, idx) => match || [``, formattedText[idx]]);
                  }
                } else {
                  formattedText = this.helpers.renameSeriesValue(idx, originalValue);
                  matches = legend && stringFilterMatches(
                    formattedText, legend.search
                  );
                }
                return matches ? {formattedText, matches, originalValue} : null;
              })
              .filter(Boolean);
            seriesValues = sorted(seriesValues, {
              transform: v => (
                isFlattenedData ? v.formattedText.join(` `).toLowerCase() : v.formattedText.toLowerCase()
              ),
            });
            if (legend.getSeriesDisplayAtIndex(idx) === `minimized`) {
              seriesValues.splice(12);
            }
            return {seriesName: series.seriesName, seriesValues};
          });
          return seriesData.some(series => series.seriesValues.length) ? seriesData : [];
        },
        renameSeriesValue: (seriesIdx, name) => (
          this.state.report.legend.data[seriesIdx].seriesName === `$event` ? renameEvent(name) : renamePropertyValue(name)
        ),
        changedSearch: ev => {
          if (ev.target.value) {
            this.state.report.legend.showAllSeries();
            if (!this.state.report.legend.search) {
              this.app.trackEvent(`Legend - Search`, this.state.report.toTrackingData());
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
            case `minimized`:
              label = `More`;
              break;
            case `expanded`:
              label = `Less`;
              break;
          }
          return label;
        },
        toggleAllSeriesValue: seriesIdx => {
          const reportTrackingData = this.state.report.toTrackingData();
          const dataKey = this.legendDataKey;
          const seriesData = this.state.report.legend.data[seriesIdx][dataKey];
          const newValue = !this.helpers.allSeriesSelected(seriesIdx);
          Object.keys(seriesData).forEach(key => seriesData[key] = newValue);
          this.app.updateLegendSeriesAtIndex(seriesIdx, dataKey, seriesData);
          this.app.trackEvent(`Legend - ${newValue ? `Show` : `Hide`} All`, reportTrackingData);
        },
        toggleShowSeriesValue: (seriesIdx, name) => {
          const dataKey = this.legendDataKey;
          const seriesData = this.state.report.legend.data[seriesIdx][dataKey];
          if (seriesData.hasOwnProperty(name)) {
            const reportTrackingData = this.state.report.toTrackingData();
            this.app.updateLegendSeriesAtIndex(seriesIdx, dataKey, {[name]: !seriesData[name]});
            this.app.trackEvent(`Legend - ${seriesData[name] ? `Show` : `Hide`}`, reportTrackingData);
          }
        },
        totalSeriesCount: idx => (
          Object.keys(this.state.report.legend.data[idx][this.legendDataKey]).length
        ),
      },
    };
  }

  get legendDataKey() {
    const legend = this.state.report.legend;
    return this.helpers.isFlattenedData() ? legend.FLAT_DATA : legend.SERIES_DATA;
  }
});

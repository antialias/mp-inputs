import { Component } from 'panel';

import {
  extend,
  renamePropertyValue,
  stringFilterMatches,
  pick,
} from '../../../../util';
import { NESTED_ARRAY_SORT_FUNCS } from '../../chart-util';
import '../../../widgets/sticky-scroll';

import template from './index.jade';
import './index.styl';

document.registerElement(`chart-legend`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        allSeriesSelected: seriesIdx => !this.state.report.legend.unselectedCount(seriesIdx, this.legendDataType),
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
          return this.state.report.legend.data[seriesIdx][this.legendDataType][name];
        },
        isSearchActive: () => !!this.state.report.legend.search,
        legendDataToDisplay: () => {
          const legend = this.state.report.legend;
          const isFlattenedData = this.helpers.isFlattenedData();
          const data = isFlattenedData ? [legend.data[0]] : legend.data;

          const sortConfig = this.state.report.sorting.bar;

          // safegaurd agaisnt old data without the new combinedResults obj
          if (data.some(series => !series.combinedResults)) {
            legend.updateLegendData(this.state.result);
          }

          const seriesData = data.map((series, idx) => {
            let seriesValues = series[this.legendDataType] || [];
            seriesValues = Object.keys(seriesValues).map(originalValue => {
              let matches = null;
              let label = null;
              const value = series.combinedResults[originalValue];
              if (isFlattenedData) {
                let dataPath = legend.data[0].flattenedDataPaths[originalValue];
                if (Object.keys(this.state.result.series).length === 1) {
                  dataPath = dataPath.slice(1, dataPath.length);
                }
                label = dataPath.map((value, idx) => this.helpers.renameSeriesValue(dataPath.length - 1 - idx, value));
                const allMatches = label.map(text => stringFilterMatches(
                  text, legend.search
                ));
                if (allMatches.some(Boolean)) {
                  matches = allMatches.map((match, idx) => match || [``, label[idx]]);
                }
              } else {
                label = this.helpers.renameSeriesValue(idx, originalValue);
                matches = legend && stringFilterMatches(
                  label, legend.search
                );
              }
              return matches ? {label, matches, originalValue, value} : null;
            }).filter(Boolean);

            if (!isFlattenedData && sortConfig.colSortAttrs) {
              let configForSeries = sortConfig;
              if (sortConfig.sortBy !== `value` || !sortConfig.sortOrder) {
                configForSeries = sortConfig.colSortAttrs[sortConfig.colSortAttrs.length - 1 - idx];
              }
              seriesValues.sort(NESTED_ARRAY_SORT_FUNCS[configForSeries.sortBy][configForSeries.sortOrder]);
            }
            if (legend.getSeriesDisplayAtIndex(idx) === `minimized`) {
              seriesValues.splice(12);
            }
            return {seriesName: series.seriesName, seriesValues};
          });
          return seriesData.some(series => series.seriesValues.length) ? seriesData : [];
        },
        renameSeriesValue: (seriesIdx, name) => (
          renamePropertyValue(name, this.state.report.legend.data[seriesIdx].seriesName)
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
          const legend = this.state.report.legend;
          const reportTrackingData = this.state.report.toTrackingData();
          const dataType = this.legendDataType;
          const seriesData = legend.data[seriesIdx][dataType];
          const showAll = !this.helpers.allSeriesSelected(seriesIdx);
          if (showAll) {
            this.app.updateReport({
              legend: legend.showAllLegendSeries(dataType),
            });
          } else {
            Object.keys(seriesData).forEach(key => seriesData[key] = false);
            this.app.updateLegendSeriesAtIndex(seriesIdx, dataType, seriesData);
          }
          this.app.trackEvent(`Legend - ${showAll ? `Show` : `Hide`} All`, reportTrackingData);
        },
        toggleShowSeriesValue: (seriesIdx, name) => {
          const dataType = this.legendDataType;
          const seriesData = this.state.report.legend.data[seriesIdx][dataType];
          if (seriesData.hasOwnProperty(name)) {
            const reportTrackingData = this.state.report.toTrackingData();
            this.app.updateLegendSeriesAtIndex(seriesIdx, dataType, {[name]: !seriesData[name]});
            this.app.trackEvent(`Legend - ${seriesData[name] ? `Show` : `Hide`}`, reportTrackingData);
          }
        },
        totalSeriesCount: idx => (
          Object.keys(this.state.report.legend.data[idx][this.legendDataType]).length
        ),
      },
    };
  }

  get legendDataType() {
    const legend = this.state.report.legend;
    return this.helpers.isFlattenedData() ? legend.FLAT_DATA : legend.SERIES_DATA;
  }
});

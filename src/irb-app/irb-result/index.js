import { Component } from 'panel';
import { capitalize } from 'mixpanel-common/util';

import {
  extend,
  filterObject,
  mapObjectKeys,
  pick,
  renameEvent,
} from '../../util';

import './chart-controls';
import './chart-legend';
import './bar-chart';
import './line-chart';
import './table-chart';
import './mp-toast';

import template from './index.jade';
import './index.styl';

const AVAILABLE_ANALYSES = {
  Bar: {
    linear: true,
    logarithmic: true,
    rolling: false,
    cumulative: false,
  },
  Line: {
    linear: true,
    logarithmic: true,
    rolling: true,
    cumulative: true,
  },
  Table: {
    linear: true,
    logarithmic: false,
    rolling: false,
    cumulative: false,
  },
  'Stacked bar': {
    linear: true,
    logarithmic: true,
    rolling: false,
    cumulative: false,
  },
  'Stacked line': {
    linear: true,
    logarithmic: true,
    rolling: true,
    cumulative: true,
  },
};
const VALUE_TOGGLE_AVAILABLE = {
  Bar: true,
  Line: false,
  Table: true,
  'Stacked bar': true,
  'Stacked line': true,
};

const ROLLING_WINDOWS_BY_UNIT = {
  hour: 12,
  day: 7,
  week: 5,
  month: 3,
  quarter: 2,
};

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

function reverseSortOrder(order) {
  return order === 'desc' ? 'asc' : 'desc';
}

document.registerElement('irb-result', class extends Component {
  get config() {
    return {
      helpers: {
        getBoundaries: () => pick(this.getBoundingClientRect(), ['top', 'left']),
        getChartLabel: () => {
          let chartLabel = ['number of'];
          const mathTypes = Array.from(new Set(this.state.report.sections.show.clauses.map(clause => clause.math)));
          if (mathTypes && mathTypes.length === 1) {
            chartLabel.unshift(mathTypes[0]);
          }

          const showValueNames = this.config.helpers.getShowValueNames();
          const headers = this.state.result.headers;
          if (headers.length === 1 && headers[0] !== '$event' && showValueNames.length === 1) {
            chartLabel.push(showValueNames[0]);
          }

          return capitalize(chartLabel.join(' '));
        },
        getDisplayOptions: () => extend(
          pick(this.state.report.displayOptions, ['analysis', 'plotStyle', 'value']),
          {timeUnit: this.state.report.sections.time.clauses[0].unit}
        ),
        getFunctionLabel: () => {
          switch (this.config.helpers.getDisplayOptions().analysis) {
            case 'logarithmic':
              return '(Logarithmic - base 10)';
            case 'cumulative':
              return '(Cumulative)';
            case 'rolling': {
              const unit = this.state.report.sections.time.clauses[0].unit;
              return `(Rolling - ${ROLLING_WINDOWS_BY_UNIT[unit]} ${unit})s`;
            }
          }
          // nothing for 'linear'
          return null;
        },
        getShowValueNames: () => this.state.report.sections.show.clauses.map(clause => renameEvent(clause.value.name)),
        getUniqueShowMathTypes: () => new Set(this.state.report.sections.show.clauses.map(clause => clause.math)),
        stringifyObjValues: obj => mapObjectKeys(obj, JSON.stringify),
        showLegend: () => {
          const chartName = this.selectedChartName().toLowerCase();
          const showClauses = this.state.report.sections.show.clauses;
          const groupClauses = this.state.report.sections.group.clauses;
          let shouldShow = false;

          if (chartName.includes('bar')) {
            shouldShow = groupClauses.length > 0 || (chartName === 'stacked bar' && showClauses.length > 1);
          } else if (chartName.includes('line')) {
            shouldShow = groupClauses.length > 0 || showClauses.length > 1 || (chartName === 'line' && showClauses[0].value.name === '$top_events');
          }

          return shouldShow;
        },
        toastClosed: () => this.update({newCachedData: false}),
        toastSelected: () => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.app.query();
          this.app.trackEvent(
            'Refresh Report',
            extend(reportTrackingData, {'toast': true})
          );
        },
        processResult: result => {
          result = result.transformed({
            analysis: this.state.report.displayOptions.analysis,
            windowSize: ROLLING_WINDOWS_BY_UNIT[this.state.report.sections.time.clauses[0].unit],
          });
          const isFlattenedData = this.state.report.displayOptions.chartType === 'line';
          if (this.config.helpers.showLegend()) {
            const legend = this.state.report.legend;
            legend.buildColorMap();
            result.series = filterObject(result.series, (value, depth, parentKeys) => {
              if (isFlattenedData) {
                return depth === 2 ? legend.data[0].flattenedData[parentKeys.concat(value).join(' ')] : true;
              } else {
                return depth > 1 ? legend.data[depth - 2].seriesData[value] : true;
              }
            });
          }
          return result;
        },
        barChartChange: ev => {
          if (ev.detail) {
            if (ev.detail.type) {
              const reportTrackingData = this.state.report.toTrackingData();
              const barSort = this.state.report.sorting.bar;
              const colIdx = ev.detail.colIdx;
              switch(ev.detail.type) {
                case 'axisSort':
                  barSort.sortBy = 'value';
                  barSort.sortOrder = ev.detail.sortOrder;
                  break;
                case 'colSort':
                  barSort.sortBy = 'column';
                  barSort.colSortAttrs = this.app.sortConfigFor(this.state.result, this.state.report.sorting).bar.colSortAttrs;
                  barSort.colSortAttrs[colIdx] = pick(ev.detail, [
                    'sortBy', 'sortOrder',
                  ]);
                  break;
              }
              this.app.updateReport();
              this.trackSort(reportTrackingData, ev.detail.type, barSort, colIdx);
            } else if (ev.detail.axis && ev.detail.maxValueText) {
              const reportTrackingData = this.state.report.toTrackingData();
              const newValue = this.state.report.displayOptions.value === 'absolute' ? 'relative' : 'absolute';
              this.state.report.displayOptions.value = newValue;
              this.app.updateReport();
              this.app.trackEvent(
                'Chart Options - Changed Value Display',
                extend(reportTrackingData, {
                  'from bar chart toggle': true,
                  'new analysis type': newValue,
                })
              );
            }
          }
        },
        tableChange: ev => {
          const reportTrackingData = this.state.report.toTrackingData();
          const {headerType, colIdx, colName} = ev.detail;
          const sortConfig = this.state.report.sorting.table;
          switch(headerType) {
            case 'left':
              if (sortConfig.sortBy === 'column') {
                // already sorting by group label
                const col = sortConfig.colSortAttrs[colIdx];
                col.sortOrder = reverseSortOrder(col.sortOrder);
              } else {
                // reset back to grouped sort
                this.state.report.sorting.table = this.app.sortConfigFor(this.state.result).table;
              }
              break;
            case 'right':
              if (sortConfig.sortBy === 'value' && sortConfig.sortColumn === colName) {
                // already sorting by this column value
                sortConfig.sortOrder = reverseSortOrder(sortConfig.sortOrder);
              } else {
                sortConfig.sortBy = 'value';
                sortConfig.sortColumn = colName;
                sortConfig.sortOrder = 'desc';
              }
              break;
          }
          this.app.updateReport();
          this.trackSort(reportTrackingData, headerType, sortConfig, colIdx);
        },
      },
      template,
    };
  }

  formattedChartName(type, style) {
    return CHART_OPTIONS[type][style];
  }

  selectedChartName() {
    return this.formattedChartName(this.state.report.displayOptions.chartType, this.state.report.displayOptions.plotStyle);
  }

  styleChoicesForChartType(type) {
    return Object.keys(CHART_OPTIONS[type]);
  }

  trackSort(reportProperties, group, sortConfig, colIdx) {
    const eventProperties = {};
    switch (group) {
      case 'colSort':
      case 'left':
        eventProperties['sort by'] = sortConfig.colSortAttrs[colIdx].sortBy;
        eventProperties['sort order'] = sortConfig.colSortAttrs[colIdx].sortOrder;
        eventProperties['sort group'] = sortConfig.sortBy;
        eventProperties['sort column index'] = colIdx;
        break;
      case 'axisSort':
      case 'right':
        eventProperties['sort by'] = sortConfig.sortBy;
        eventProperties['sort order'] = sortConfig.sortOrder;
        eventProperties['sort group'] = 'axis';
        break;
    }
    this.app.trackEvent('Chart Options - Sort', extend(reportProperties, eventProperties));
  }

  isAnalysisEnabled(analysis, chartName=this.selectedChartName()) {
    return AVAILABLE_ANALYSES[chartName][analysis];
  }

  isValueToggleEnabled(chartName=this.selectedChartName()) {
    return VALUE_TOGGLE_AVAILABLE[chartName];
  }

  updateDisplayOptions(displayOptions) {
    const options = extend(this.state.report.displayOptions, displayOptions);

    const chartToggle = extend(this.state.chartToggle, {editingType: null});
    chartToggle[options.chartType].plotStyle = options.plotStyle;
    this.app.updateChartToggle(chartToggle);

    const newChartName = this.formattedChartName(options.chartType, options.plotStyle);

    this.app.updateDisplayOptions(extend(options, {
      analysis: this.isAnalysisEnabled(options.analysis, newChartName) ? options.analysis : 'linear',
      value: this.isValueToggleEnabled(newChartName) ? options.value : 'absolute',
    }));
  }
});

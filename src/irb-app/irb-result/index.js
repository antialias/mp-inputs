import { Component } from 'panel';
import { capitalize } from 'mixpanel-common/util';

import { extend, filterObjectAtDepth, pick, renameEvent } from '../../util';

import './bar-chart';
import './line-chart';
import './table-chart';
import './chart-controls';
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
        getDisplayOptions: () => pick(this.state.report.displayOptions, ['analysis', 'plotStyle', 'value']),
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
        stringifyObjValues: (obj) => {
          const stringified = {};
          Object.keys(obj).forEach(key => stringified[key] = JSON.stringify(obj[key]));
          return stringified;
        },
        toastClosed: () => this.update({newCachedData: false}),
        toastSelected: () => this.app.query(),
        processResult: result => {
          result = result.transformed({
            analysis: this.state.report.displayOptions.analysis,
            windowSize: ROLLING_WINDOWS_BY_UNIT[this.state.report.sections.time.clauses[0].unit],
          });

          result.series = filterObjectAtDepth(result.series, series => this.state.report.series.data[series], 2);

          return result;
        },
        barChartChange: ev => {
          if (ev.detail) {
            if (ev.detail.type) {
              const barSort = this.state.report.sorting.bar;
              switch(ev.detail.type) {
                case 'axisSort':
                  barSort.sortBy = 'value';
                  barSort.sortOrder = ev.detail.sortOrder;
                  break;
                case 'colSort':
                  barSort.sortBy = 'column';
                  barSort.colSortAttrs = this.app.sortConfigFor(this.state.result, this.state.report.sorting).bar.colSortAttrs;
                  barSort.colSortAttrs[ev.detail.colIdx] = pick(ev.detail, [
                    'sortBy', 'sortOrder',
                  ]);
                  break;
              }
              this.app.updateReport();
            } else if (ev.detail.axis && ev.detail.maxValueText) {
              this.state.report.displayOptions.value = this.state.report.displayOptions.value === 'absolute' ? 'relative' : 'absolute';
              this.app.updateReport();
            }
          }
        },
        tableChange: ev => {
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

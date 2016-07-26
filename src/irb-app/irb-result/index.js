import { Component } from 'panel';
import { filterObjectAtDepth } from './chart-util';
import { extend, pick, renameEvent } from '../../util';

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
  Bar: false,
  Line: false,
  Table: false,
  'Stacked bar': true,
  'Stacked line': true,
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
        getChartOptions: () => pick(this.state.report.displayOptions, ['analysis', 'plotStyle']),
        getChartLabel: () => {
          return '';
        },
        getShowValueNames: () => this.state.report.sections.show.clauses.map(clause => renameEvent(clause.value.name)),
        toastClosed: () => this.update({newCachedData: false}),
        toastSelected: () => this.app.query(),
        filterResults: (result, depth=2) => ({
          headers: result.headers,
          series: filterObjectAtDepth(
            result.series, series => this.state.report.series.data[series], depth
          ),
        }),

        barChartChange: ev => {
          const sortProps = ev.detail && ev.detail.type && ev.detail;
          if (sortProps) {
            const barSort = this.state.report.sorting.bar;
            switch(sortProps.type) {
              case 'axisSort':
                barSort.sortBy = 'value';
                barSort.sortOrder = sortProps.sortOrder;
                break;
              case 'colSort':
                barSort.sortBy = 'column';
                barSort.colSortAttrs = this.app.sortConfigFor(this.state.result, this.state.report.sorting).bar.colSortAttrs;
                barSort.colSortAttrs[sortProps.colIdx] = pick(sortProps, [
                  'sortBy', 'sortOrder',
                ]);
                break;
            }
            this.app.updateReport();
          }
        },

        tableData: (result, resourceDescription) => extend(
          this.config.helpers.filterResults(result),
          {resourceDescription}
        ),
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

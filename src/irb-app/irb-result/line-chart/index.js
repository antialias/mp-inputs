/* global $ */

import moment from 'moment';
import { Component } from 'panel';
import WebComponent from 'webcomponent';

import * as util from '../../../util';
import {
  nestedObjectPaths,
} from '../chart-util';

import template from './index.jade';
import './index.styl';

const LOGARITHMIC_CHART_ZERO_REMAPPING = 0.6;

document.registerElement('line-chart', class extends Component {
  get config() {
    return {
      template,
      defaultState: {
        data: {},
        util,
      },
    };
  }

  attributeChangedCallback() {
    let { headers, series } = JSON.parse(this.getAttribute('data')) || {};

    if (headers && series) {
      this.update({
        // transform nested object into single-level object:
        // {'a': {'b': {'c': 5}}} => {'a / b / c': 5}
        data: util.objectFromPairs(nestedObjectPaths(series, 1).map(path =>
          [this.formatHeader(path.slice(0, -1), headers), path.slice(-1)[0]]
        )),
        displayOptions: JSON.parse(this.getAttribute('display-options')),
      });
    }
  }

  formatHeader(parts, headers) {
    if (headers[0] === '$events') {
      parts = [util.renameEvent(parts[0]), ...parts.slice(0, -1).map(util.renameProperty)];
    } else {
      parts = parts.map(util.renameProperty);
    }
    return parts.join(' / ');
  }
});

document.registerElement('mp-line-chart', class extends WebComponent {
  attachedCallback() {
    this.renderMPChart();
  }

  attributeChangedCallback() {
    this._data = JSON.parse(this.getAttribute('data') || '{}');
    this._displayOptions = JSON.parse(this.getAttribute('display-options') || '{}');

    this.renderMPChart();
  }

  tooltipFormatter() {
    const timeUnit = this._displayOptions.timeUnit;
    const timeFormatting = {
      'hour': 'MMM D[,] ha',
      'day': 'MMM D',
      'week': 'MMM D',
      'month': 'MMMM YYYY',
      'quarter': 'MMM Do YYYY',
      'year': 'YYYY',
    };
    return function() {
      return `
        <div class="title">${this.series.name}</div>
        <div class="results">
          <div class="absolute">
            <span class="date">${moment(this.x).format(timeFormatting[timeUnit])}: </span>
            <span class="count">${this.y}</span>
          </div>
          ${this.percentage ? `<div class="percent">${Math.round(this.percentage * 10) / 10}%</div>` : ''}
        </div>
      `;
    };
  }

  createChartOptions() {
    const displayOptions = this._displayOptions || {};
    const axisOptions = {
      endOnTick: true,
      lineWidth: 1,
      lineColor: '#e5e7ef',
      minPadding: 0,
      maxPadding: 0,
      startOnTick: true,
    };
    const highchartsOptions = {
      xAxis: util.extend(axisOptions, {
        endOnTick: false,
        startOnTick: false,
      }),
      yAxis: util.extend(axisOptions, {
        showFirstLabel: true,
        showLastLabel: false,
      }),
      chart: {
        marginTop: 0,
        marginRight: 0,
        marginBottom: null,
        marginLeft: null,
        spacingBottom: 30,
        spacingLeft: 28,
        type: 'line',
      },
      colors: [ // taken from order in irb-result/index.styl
        '#23588c',
        '#106eca',
        '#4ba8ff',
        '#24d2ef',
        '#47b6ac',
        '#106eca',
        '#f2af34',
        '#ffd209',
      ],
      plotOptions: {
        series: {
          fillOpacity: 0.7,
          marker: {
            enabled: null,
            hover: {
              enabled: true,
            },
          },
          stacking: null,
        },
        line: {
          lineWidth: 3,
          states: {
            hover: {
              lineWidth: 4,
              lineWidthPlus: 0,
            },
          },
          marker: {
            hover: {
              enabled: true,
            },
          },
        },
      },
      tooltip: {
        borderWidth: 0,
        formatter: this.tooltipFormatter(),
      },
    };

    if (displayOptions.plotStyle === 'stacked') {
      highchartsOptions.plotOptions.series.stacking = 'normal';
      highchartsOptions.plotOptions.series.lineWidth = 0;
      highchartsOptions.chart.type = 'area';
      if (displayOptions.value === 'relative') {
        highchartsOptions.plotOptions.series.stacking = 'percent';
      }
    }
    if (displayOptions.analysis === 'logarithmic') {
      highchartsOptions.yAxis.type = 'logarithmic';
      highchartsOptions.yAxis.min = LOGARITHMIC_CHART_ZERO_REMAPPING;
    }
    return {
      chartType: 'line',
      MPstyling: false,
      lineLimit: false,
      highchartsOptions,
    };
  }

  renderMPChart() {
    if (this.$el) {
      this.$el.remove();
    }

    this.$el = $('<div>').appendTo(this);
    this.$el
      .MPChart(this.createChartOptions())
      .MPChart('setData', this._data);
  }
});

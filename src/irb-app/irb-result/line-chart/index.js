/* global $ */

import { Component } from 'panel';
import WebComponent from 'webcomponent';

import * as util from '../../../util';
import {
  nestedObjectPaths,
} from '../chart-util';

import template from './index.jade';
import './index.styl';

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
    let { headers, series } = JSON.parse(this.getAttribute('data'));

    this.update({
      // transform nested object into single-level object:
      // {'a': {'b': {'c': 5}}} => {'a / b / c': 5}
      data: util.objectFromPairs(nestedObjectPaths(series, 1).map(path =>
        [this.formatHeader(path.slice(0, -1), headers), path.slice(-1)[0]]
      )),
      chartOptions: JSON.parse(this.getAttribute('chartOptions')),
    });
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
  createdCallback() {
    this.$el = $('<div>').appendTo(this);
  }

  attachedCallback() {
    this.renderMPChart();
    this._chart_initialized = true;
  }

  attributeChangedCallback() {
    const data = this.getAttribute('data');
    const options = this.getAttribute('chartOptions');

    if (this._data_string !== data) {
      this._data_string = data;

      if (this._chart_initialized) {
        this.$el.MPChart('setData', JSON.parse(data));
      }
    }

    if (!util.isEqual(this.chartOptions, JSON.parse(options))) {
      this._chartOptions = options;

      if (this._chart_initialized) {
        this.$el.remove();
        this.$el = $('<div>').appendTo(this);
        this.renderMPChart();
      }
    }
  }

  get data() {
    return JSON.parse(this._data_string || '{}');
  }

  get chartOptions() {
    return JSON.parse(this._chartOptions || '{}');
  }

  createHighchartOptions() {
    const chartOptions = this.chartOptions || {};
    const highchartsOptions = {
      chart: {
        type: 'line',
      },
      plotOptions: {
        series: {
          fillOpacity: 0.7,
          marker: {
            enabled: false,
            symbol: 'url()',
          },
          stacking: null,
        },
      },
      tooltip: {
        borderColor: '#c4c8d6',
        borderRadius: 3,
        crosshairs: [true],
        formatter: function() {
          const tooltip = [`<span class="title"> ${this.series.name}</span><span class="results"><span class="count">${this.y}</span>`];
          if (this.percentage) {
            tooltip.push(` <span class="percent">${Math.round(this.percentage * 10)/10}%</span>`);
          }
          tooltip.push('</span>');
          return tooltip.join('');
        },
      },
    };

    if (chartOptions.plotStyle == 'stacked') {
      highchartsOptions.plotOptions.series.stacking = 'normal';
      highchartsOptions.plotOptions.series.lineWidth = 0;
      highchartsOptions.chart.type = 'area';
    }
    return { highchartsOptions };
  }

  renderMPChart() {
    this.$el
      .MPChart(util.extend(this.createHighchartOptions(), {chartType: 'line'}))
      .MPChart('setData', JSON.parse(this._data_string || '{}'));
  }
});

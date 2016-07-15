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
  attachedCallback() {
    this.renderMPChart();
  }

  attributeChangedCallback() {
    this._data = JSON.parse(this.getAttribute('data') || '{}');
    this._chartOptions = JSON.parse(this.getAttribute('chartOptions') || '{}');

    this.renderMPChart();
  }

  createChartOptions() {
    const chartOptions = this._chartOptions || {};
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
          const tooltip = [`<div class="title"> ${this.series.name}</div><div class="results"><div class="count">${this.y}</div>`];
          if (this.percentage) {
            tooltip.push(`<div class="percent">${Math.round(this.percentage * 10) / 10}%</div>`);
          }
          tooltip.push('</div>');
          return tooltip.join('');
        },
      },
    };

    if (chartOptions.plotStyle == 'stacked') {
      highchartsOptions.plotOptions.series.stacking = 'normal';
      highchartsOptions.plotOptions.series.lineWidth = 0;
      highchartsOptions.chart.type = 'area';
    }
    return { highchartsOptions, chartType: 'line' };
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

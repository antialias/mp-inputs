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

  get data() {
    return JSON.parse(this._data_string);
  }

  set data(data) {
    if (this._data_string !== data) {
      this._data_string = data;

      if (this._chart_initialized) {
        this.$el.MPChart('setData', JSON.parse(data));
      }
    }
  }

  get chartOptions() {
    return JSON.parse(this._chartOptions);
  }

  set chartOptions(options) {
    if (!util.isEqual(this._chartOptions, options)) {
      this._chartOptions = options;

      if (this._chart_initialized) {
        this.$el.remove();
        this.$el = $('<div>').appendTo(this);
        this.renderMPChart();
      }
    }
  }

  createHighchartOptions() {
    const chartOptions = this.chartOptions || {};
    const highchartsOptions = {
      plotOptions: {
        series: {
          stacking: null,
          marker: {
            enabled: false,
          },
        },
      },
    };

    if (chartOptions.plotStyle == 'stacked') {
      highchartsOptions.plotOptions.series.stacking = 'normal';
    }
    return { highchartsOptions };
  }

  renderMPChart() {
    this.$el
      .MPChart(util.extend(this.createHighchartOptions(), {chartType: 'line'}))
      .MPChart('setData', JSON.parse(this._data_string || '{}'));
  }
});

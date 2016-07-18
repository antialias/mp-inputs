/* global $ */

import { Component } from 'panel';
import WebComponent from 'webcomponent';

import * as util from '../../../util';
import {
  nestedObjectMax,
  nestedObjectSum,
  nestedObjectToBarChartData,
  stackedNestedObjectMax,
} from '../chart-util';

import template from './index.jade';
import './index.styl';

document.registerElement('bar-chart', class extends Component {
  get config() {
    return {
      template,
      defaultState: {
        headers: [],
        rows: [],
        chartMax: 0,
        chartOptions: null,
        mathTypes: [],
        util,
      },
      helpers: {
        getHeaderWidth: (text) => util.getTextWidth(text, 'bold 14px Helvetica'),
      },
    };
  }

  attributeChangedCallback() {
    let {headers, series} = this.getJSONAttribute('data');
    const chartOptions = this.getJSONAttribute('chartOptions') || {};
    const mathTypes = JSON.parse(this.getAttribute('mathTypes')) || [];
    const sortConfig = this.getJSONAttribute('sorting') ;
    if (!this.validSortConfig(headers, sortConfig)) {
      return;
    }

    if (chartOptions && chartOptions.plotStyle == 'stacked') {
      headers.splice(-1, 1);
    }

    series = nestedObjectSum(series);
    const rows = nestedObjectToBarChartData(series, sortConfig);

    const chartMax = chartOptions.plotStyle == 'stacked' ? stackedNestedObjectMax(series) : nestedObjectMax(series);

    this.update({
      chartMax,
      chartOptions,
      headers,
      mathTypes,
      rows,
    });
  }

  validSortConfig(headers, sortConfig) {
    return sortConfig && (
      sortConfig.sortBy === 'value' ||
      sortConfig.colSortAttrs.length === headers.length
    );
  }
});

document.registerElement('irb-bar-chart-header', class extends WebComponent {
  createdCallback() {
    this.$el = $('<div>').addClass('bar-chart-container').appendTo(this);
  }

  attributeChangedCallback() {
    this.mathTypes = JSON.parse(this.getAttribute('mathTypes') || '[]');
    this.render();
  }

  render() {
    this.$el.empty();
    let $headers = $(this.headers.map(header =>
      $('<div>')
        .addClass('bar-chart-header')
        .append($('<div>').addClass('text').html(
          header === '$event' ? 'Events' : util.renameProperty(header)
        )).get(0)
    ));
    this.$el.append($headers);

    let chartLabel = ['number of'];
    if (this.mathTypes && this.mathTypes.length == 1) {
      chartLabel.unshift(this.mathTypes[0]);
    }
    const $axisTitle = $('<div>').addClass('axis-title text').html(util.capitalize(chartLabel.join(' ')));

    let $axis = $('<div class="bar-chart-axis"></div>')
      .append($axisTitle)
      .append($('<div>').addClass('max-value text').html(util.commaizeNumber(this.chartMax)));

    this.$el.append($axis);

    window.requestAnimationFrame(() => { // defer so we can inspect the fully-rendered table
      const tableColWidths = this.$el.parents('table')
        .find('tbody tr:first-child td').map((i, el) => $(el).outerWidth()).get();

      // set header widths
      $headers.each((i, el) => {
        $(el).width(tableColWidths[i]);
      });

      // set axis width
      const headerWidths = tableColWidths.slice(0, -1).reduce((sum, width) => sum + width, 0);
      $axis.width(`calc(100% - ${headerWidths}px)`);
    });
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    this._headers = JSON.parse(headers);
    this.render();
  }

  get chartMax() {
    return this._chartMax;
  }

  set chartMax(chartMax) {
    this._chartMax = JSON.parse(chartMax);
    this.render();
  }
});

/* global $ */

import { Component } from 'panel';
import WebComponent from 'webcomponent';

import * as util from '../../../util';
import {
  getTickDistance,
  nestedObjectMax,
  nestedObjectSum,
  nestedObjectToBarChartData,
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
        gridLineDistance: 0,
        util,
      },
      helpers: {
        getHeaderWidth: (text) => util.getTextWidth(text, 'bold 14px Helvetica'),
      },
    };
  }

  attributeChangedCallback() {
    let {headers, series} = this.getJSONAttribute('data');
    const chartOptions = JSON.parse(this.getAttribute('chartOptions'));
    const sortConfig = this.getJSONAttribute('sorting');
    if (!this.validSortConfig(headers, sortConfig)) {
      return;
    }

    series = nestedObjectSum(series);
    const rows = nestedObjectToBarChartData(series, sortConfig);
    const chartMax = nestedObjectMax(series);
    const gridLineDistance = getTickDistance(chartMax);

    this.update({
      chartMax,
      chartOptions,
      gridLineDistance,
      headers,
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
    this.$el = $('<div>').appendTo(this);
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

    // get an array of tick values, something like [25, 50, 75, 100, ...]
    let tick = 0;
    let ticks = [];
    let tickDistance = getTickDistance(this._chartMax);
    if (this._chartMax) {
      do {
        ticks.push(tick);
        tick += tickDistance;
      } while (tick < this._chartMax);
    }

    let $ticks = $(ticks.map(tick =>
      $('<div>')
        .addClass('bar-chart-tick')
        .width(`${tickDistance / this._chartMax * 100}%`)
        .append($('<div>').addClass('text').html(util.abbreviateNumber(tick)))
        .get(0)
    ));

    let $axis = $('<div class="bar-chart-axis"></div>').append($ticks);
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

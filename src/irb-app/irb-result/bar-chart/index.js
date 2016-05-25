/* global $ */

import { Component } from 'panel';
import WebComponent from 'webcomponent';

import * as util from '../../../util';
import {
  getTickDistance,
  nestedObjectMax,
  nestedObjectSum,
  nestedObjectToTableRows,
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
        gridLineDistance: 0,
        util,
      },
    };
  }

  attachedCallback() {}

  set data(data) {
    if (!this.$panelRoot) {
      super.attachedCallback();
    }

    this.render(JSON.parse(data));
  }

  render(data) {
    const headers = data.headers;
    const series = nestedObjectSum(data.series);

    // for each table row, split the data entry (last entry) into
    // two key/value list cells, sorting alphabetically by key
    const rows = nestedObjectToTableRows(series, 1).map(row => {
      const data = row.slice(-1)[0].value;
      const keys = Object.keys(data)
        .sort((a, b) => data[b] - data[a])
        .filter(key => data[key]);
      const values = keys.map(key => data[key]);

      return [...row.slice(0, -1), keys, values];
    });

    const chartMax = nestedObjectMax(series);
    const gridLineDistance = getTickDistance(chartMax);

    this.update({headers, rows, chartMax, gridLineDistance});
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
          header === '$events' ? 'Events' : util.renameProperty(header)
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

    setTimeout(() => { // defer so we can inspect the fully-rendered table
      const tableColWidths = this.$el.parents('table')
        .find('tbody tr:first-child td').map((i, el) => $(el).outerWidth()).get();

      // set header widths
      $headers.each((i, el) => {
        $(el).width(tableColWidths[i]);
      });

      // set axis width
      const headerWidths = tableColWidths.slice(0, -1).reduce((sum, width) => sum + width, 0);
      $axis.width(`calc(100% - ${headerWidths}px)`);
    }, 0);
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

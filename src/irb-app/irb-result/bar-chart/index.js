/* global $ */

import { Component } from 'panel';
import WebComponent from 'webcomponent';

import * as util from '../../../util';
import {
  nestedObjectMax,
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
        headerSortPanel: null,
        rows: [],
        chartBoundaries: {},
        chartMax: 0,
        chartOptions: {},
        hoverTooltip: {show: false},
        mathTypes: [],
        showValueNames: [],
        util,
      },
      helpers: {
        getHeaderWidth: (text) => util.getTextWidth(text, 'bold 14px Helvetica'),
        headerClick: ev => {
          if (ev.detail && typeof ev.detail.header === 'number') {
            const headerIdx = ev.detail.header;
            this.update({
              headerSortPanel: headerIdx === this.state.headerSortPanel ? null : headerIdx,
            });
          }
        },
        headersToDisplay: () => {
          let headers = null;
          if (this.state.chartOptions.plotStyle == 'stacked') {
            headers = this.state.headers.slice(0, this.state.headers.length - 1);
            if (!headers.length) {
              headers.push('$event');
            }
          }
          return headers || this.state.headers;
        },
        onMouseEnter: (ev, name, value, percent) => {
          let hoverTooltip = util.extend(this.state.hoverTooltip, {show: true});
          if (ev && name) {
            const chartBounds = this.state.chartBoundaries;
            const targetBarBounds = ev.target.getBoundingClientRect();
            hoverTooltip = util.extend(hoverTooltip, {
              name,
              percent,
              value,
              cssTop: `${targetBarBounds.top - chartBounds.top}px`,
              cssLeft: `${targetBarBounds.left - chartBounds.left + (targetBarBounds.width / 2)}px`,
            });
          }
          this.update({hoverTooltip});
        },
        onMouseLeave: () => {
          this.update({hoverTooltip: util.extend(this.state.hoverTooltip, {show: false})});
        },
      },
    };
  }

  attributeChangedCallback() {
    let {headers, series} = this.getJSONAttribute('data');
    const chartBoundaries = this.getJSONAttribute('chartBoundaries') || {};
    const chartOptions = this.getJSONAttribute('chartOptions') || {};
    const mathTypes = this.getJSONAttribute('mathTypes') || [];
    const showValueNames = this.getJSONAttribute('showValueNames') || [];
    const sortConfig = this.getJSONAttribute('sorting');
    if (!this.validSortConfig(headers, sortConfig)) {
      return;
    }

    series = util.nestedObjectSum(series);
    const rows = nestedObjectToBarChartData(series, sortConfig);

    const chartMax = chartOptions.plotStyle == 'stacked' ? stackedNestedObjectMax(series) : nestedObjectMax(series);

    this.update({
      chartMax,
      chartBoundaries,
      chartOptions,
      headers,
      mathTypes,
      showValueNames,
      sortConfig,
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
    this.headers = [];
    this.chartMax = null;
    this.mathTypes = [];
    this.showValueNames = [];
  }

  attributeChangedCallback() {
    this.headers = this.getJSONAttribute('headers') || [];
    this.chartMax = this.getJSONAttribute('chart-max');
    this.mathTypes = this.getJSONAttribute('math-types') || [];
    this.showValueNames = this.getJSONAttribute('show-value-names') || [];
    this.sortConfig = this.getJSONAttribute('sort-config');
    this.render();
  }

  render() {
    this.$el.empty();
    let headersEl = this;
    let $headers = $(this.headers.map((header, idx) =>
      $('<div>')
        .addClass('bar-chart-header')
        .data('header-idx', idx)
        .on('click', function() {
          headersEl.dispatchEvent(new CustomEvent('click', {
            detail: {header: $(this).data('header-idx')},
          }));
        })
        .append($('<div>').addClass('text').html(
          header === '$event' ? 'Events' : util.renameProperty(header)
        )).get(0)
    ));
    this.$el.append($headers);

    let chartLabel = ['number of'];
    if (this.mathTypes && this.mathTypes.length == 1) {
      chartLabel.unshift(this.mathTypes[0]);
    }

    if (this.headers.length == 1 && this.headers[0] !== '$event' && this.showValueNames.length == 1) {
      chartLabel.push(this.showValueNames[0]);
    }

    const $axisTitle = $('<div>').addClass('axis-title text').html(util.capitalize(chartLabel.join(' ')));

    let $axis = $('<div class="bar-chart-axis"></div>')
      .append($axisTitle)
      .append($('<div>').addClass('max-value text').html(util.abbreviateNumber(this.chartMax)));

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
});

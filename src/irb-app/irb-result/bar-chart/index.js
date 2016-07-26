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

const SORT_ICON_WIDTH = 36;

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
        chartLabel: '',
        hoverTooltip: {show: false},
        showValueNames: [],
        util,
      },
      helpers: {
        getHeaderWidth: (text) => util.getTextWidth(text, 'bold 14px Helvetica') + SORT_ICON_WIDTH,
        headerClick: ev => {
          if (ev.detail) {
            if (typeof ev.detail.header === 'number') {
              const headerIdx = ev.detail.header;
              this.update({
                headerSortPanel: headerIdx === this.state.headerSortPanel ? null : headerIdx,
              });
            } else if (ev.detail.axis) {
              this.update({
                headerSortPanel: this.state.headerSortPanel === 'axis' ? null : 'axis',
              });
            }
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
        selectAxisSort: (sortOrder) => {
          this.update({headerSortPanel: null});
          this.dispatchEvent(new CustomEvent('change', {
            detail: {
              type: 'axisSort',
              sortOrder,
            },
          }));
        },
        selectColumnSort: (sortBy, sortOrder, colIdx) => {
          this.update({headerSortPanel: null});
          this.dispatchEvent(new CustomEvent('change', {
            detail: {
              colIdx,
              sortBy,
              sortOrder,
              type: 'colSort',
            },
          }));
        },
      },
    };
  }

  attributeChangedCallback() {
    let {headers, series} = this.getJSONAttribute('data');
    const chartBoundaries = this.getJSONAttribute('chart-boundaries') || {};
    const chartOptions = this.getJSONAttribute('chart-options') || {};
    const chartLabel = this.getJSONAttribute('chart-label') || '';
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
      chartLabel,
      headers,
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
    this.chartLabel = '';
  }

  attributeChangedCallback() {
    this.headers = this.getJSONAttribute('headers') || [];
    this.chartMax = this.getJSONAttribute('chart-max');
    this.chartLabel = this.getJSONAttribute('chart-label');
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
        ))
        .append($('<div>').addClass(headersEl.sortIconClass(idx)))
        .get(0)
    ));
    this.$el.append($headers);

    const $axisTitle = $('<div>').addClass('axis-title text').html(this.chartLabel);

    let $axis = $('<div class="bar-chart-axis"></div>')
      .on('click', function() {
        headersEl.dispatchEvent(new CustomEvent('click', {detail: {axis: true}}));
      })
      .append($axisTitle)
      .append($('<div>').addClass(headersEl.sortIconAxisClass()))
      .append($('<div>').addClass('max-value text').html(util.abbreviateNumber(this.chartMax)))
      ;

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

  sortIconClass(headerIdx) {
    if (this.sortConfig && this.sortConfig.sortBy === 'column') {
      const colAttrs = this.sortConfig.colSortAttrs[headerIdx];
      return colAttrs ? `sort-icon sort-icon-${colAttrs.sortBy}-${colAttrs.sortOrder}` : '';
    } else {
      return '';
    }
  }

  sortIconAxisClass() {
    if (this.sortConfig && this.sortConfig.sortBy === 'value') {
      return `sort-icon sort-icon-value-${this.sortConfig.sortOrder}`;
    } else {
      return '';
    }
  }
});

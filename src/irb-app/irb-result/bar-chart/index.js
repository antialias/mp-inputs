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

document.registerElement(`bar-chart`, class extends Component {
  get config() {
    return {
      template,
      defaultState: {
        headers: [],
        headerSortPanel: null,
        rows: [],
        chartMax: 0,
        segmentColorMap: {},
        displayOptions: {},
        chartLabel: ``,
        functionLabel: ``,
        hoverTooltip: {rowIdx: null, cellIdx: null},
        showValueNames: [],
        util,
      },
      helpers: {
        getHeaderWidth: text => util.getTextWidth(text, `bold 14px Helvetica`) + SORT_ICON_WIDTH,
        headersToDisplay: () => {
          let headers = null;
          if (this.state.displayOptions.plotStyle === `stacked`) {
            headers = this.state.headers.slice(0, this.state.headers.length - 1);
            if (!headers.length) {
              headers.push(`$event`);
            }
          }
          return headers || this.state.headers;
        },
        onMouseEnter: (ev, rowIdx, cellIdx) => {
          const hoverTooltip = util.extend(this.state.hoverTooltip, {rowIdx, cellIdx});
          this.update({hoverTooltip});
        },
        onMouseLeave: () => {
          this.update({hoverTooltip: util.extend(this.state.hoverTooltip, {rowIdx: null, cellIdx: null})});
        },
        sortChange: ev => ev.detail && this.dispatchEvent(new CustomEvent(`change`, {detail: ev.detail})),
      },
    };
  }

  attributeChangedCallback() {
    let {headers, series} = this.getJSONAttribute(`data`);
    const segmentColorMap = this.getJSONAttribute(`segment-color-map`) || {};
    const chartLabel = this.getJSONAttribute(`chart-label`) || ``;
    const displayOptions = this.getJSONAttribute(`display-options`) || {};
    const functionLabel = this.getJSONAttribute(`function-label`) || ``;
    let sortConfig = this.getJSONAttribute(`sorting`);

    if (!this.validSortConfig(headers, sortConfig)) {
      return;
    }

    series = util.nestedObjectSum(series);
    const rows = nestedObjectToBarChartData(series, sortConfig);

    const chartMax = displayOptions.plotStyle === `stacked` ? stackedNestedObjectMax(series) : nestedObjectMax(series);

    sortConfig = util.extend(sortConfig, {hideFirstSort: displayOptions.plotStyle === `stacked` && rows.length === 1});

    this.update({
      chartLabel,
      chartMax,
      segmentColorMap,
      displayOptions,
      functionLabel,
      headers,
      rows,
      sortConfig,
    });
  }

  validSortConfig(headers, sortConfig) {
    return sortConfig && (
      sortConfig.sortBy === `value` ||
      sortConfig.colSortAttrs.length === headers.length
    );
  }
});

document.registerElement(`irb-bar-chart-header`, class extends WebComponent {
  createdCallback() {
    this.$el = $(`<div>`).addClass(`chart-header-container`).appendTo(this);
    this.chartLabel = ``;
    this.chartMax = null;
    this.displayOptions = {};
    this.functionLabel = ``;
    this.headers = [];
    this.sortConfig = {};
  }

  attributeChangedCallback() {
    this.chartLabel = this.getJSONAttribute(`chart-label`);
    this.chartMax = this.getJSONAttribute(`chart-max`);
    this.displayOptions = this.getJSONAttribute(`display-options`) || {};
    this.functionLabel = this.getJSONAttribute(`function-label`);
    this.headers = this.getJSONAttribute(`headers`) || [];
    this.sortConfig = this.getJSONAttribute(`sort-config`) || {};
    this.render();
  }

  createSortHolder(type, sortByOptions, sortOrderOptions, headerIdx=0) {
    const $sortControls = $(`<div>`).addClass(`sort-controls`);

    sortByOptions.forEach(sortBy => {
      sortOrderOptions.forEach(sortOrder => {
        const $sortButton = $(`<div>`).addClass(`sort-icon sort-icon-${sortBy}-${sortOrder}`);
        $sortButton.on(`click`, () => this.selectHeaderSort(type, headerIdx, sortBy, sortOrder));
        $sortControls.append($sortButton);
      });
    });

    return $(`<div>`).addClass(`sort-holder`).append($sortControls);
  }

  selectHeaderSort (type, colIdx, sortBy, sortOrder) {
    this.dispatchEvent(new CustomEvent(`change`, {
      detail: {
        colIdx,
        sortBy,
        sortOrder,
        type,
      },
    }));
  }

  hideAllSortHolders(ignoreElement) {
    if (this.sortHolders) {
      this.sortHolders.forEach(el => {
        if (!el.is(ignoreElement)) {
          el.removeClass(`active-sort-panel`);
        }
      });
    }
  }

  render() {
    this.$el.empty();
    this.sortHolders = [];
    let headersEl = this;
    let $headers = $(this.headers.map((header, idx) => {
      const sortHolder = this.createSortHolder(`colSort`, [`label`, `value`], [`asc`, `desc`], idx);
      this.sortHolders.push(sortHolder);
      return $(`<div>`)
        .addClass(`bar-chart-header`)
        .data(`header-idx`, idx)
        .on(`click`, () => {
          this.hideAllSortHolders(sortHolder);
          sortHolder.toggleClass(`active-sort-panel`);
        })
        .append($(`<div>`).addClass(`text`).html(
          header === `$event` ? `Events` : util.renameProperty(header)
        ))
        .append($(`<div>`).addClass(headersEl.sortIconClass(idx)))
        .append(sortHolder)
        .get(0);
    }));

    this.$el
      .addClass(`loading`)
      .append($headers);

    let chartTitle = this.chartLabel;
    if (this.functionLabel) {
      chartTitle += ` ${this.functionLabel}`;
    }

    const sortAxisHolder = this.createSortHolder(`axisSort`, [`value`], [`asc`, `desc`]);
    this.sortHolders.push(sortAxisHolder);
    const $axisTitle = $(`<div>`)
      .addClass(`axis-title`)
      .append($(`<div>`).addClass(`text`).html(chartTitle))
      .append($(`<div>`).addClass(headersEl.sortIconAxisClass()))
      .append(sortAxisHolder);

    const $axisMaxValue = $(`<div>`)
      .addClass(`text`)
      .on(`click`, function(ev) {
        headersEl.dispatchEvent(new CustomEvent(`change`, {detail: {axis: true, maxValueText: true}}));
        ev.stopPropagation();
      })
      .html(this.displayOptions.value === `absolute` ? util.abbreviateNumber(this.chartMax) : `100%`);

    let $axis = $(`<div class="bar-chart-axis"></div>`)
      .on(`click`, () => {
        this.hideAllSortHolders(sortAxisHolder);
        sortAxisHolder.toggleClass(`active-sort-panel`);
      })
      .append($axisTitle)
      .append($(`<div>`).addClass(`max-value`).append($axisMaxValue));

    this.$el.append($axis);

    window.requestAnimationFrame(() => { // defer so we can inspect the fully-rendered table
      const tableColWidths = this.$el.parents(`table`)
        .find(`tbody tr:first-child td`).map((i, el) => $(el).outerWidth()).get();

      // set header widths
      $headers.each((i, el) => {
        $(el).width(tableColWidths[i]);
      });

      // set axis width
      const headerWidths = tableColWidths.slice(0, -1).reduce((sum, width) => sum + width, 0);
      $axis.width(`calc(100% - ${headerWidths}px)`);
      this.$el.removeClass(`loading`);
    });
  }

  sortIconClass(headerIdx) {
    let elClass = null;
    if (this.sortConfig) {
      if (this.sortConfig.hideFirstSort && headerIdx === 0) {
        return `no-sort-icon`;
      } else if (this.sortConfig.sortBy === `column`) {
        const colAttrs = this.sortConfig.colSortAttrs[headerIdx];
        if (colAttrs) {
          elClass = `sort-icon-${colAttrs.sortBy}-${colAttrs.sortOrder}`;
        }
      }
    }
    return `sort-icon ${elClass || `sort-icon-unselected`}`;
  }

  sortIconAxisClass() {
    let elClass = null;
    if (this.sortConfig) {
      if (this.sortConfig.colSortAttrs && this.displayOptions && this.displayOptions.plotStyle === `stacked`) {
        const headerIdx = this.sortConfig.hideFirstSort ? 0 : this.headers.length;
        const colAttrs = this.sortConfig.colSortAttrs[headerIdx];
        if (colAttrs) {
          elClass = `sort-icon-${colAttrs.sortBy}-${colAttrs.sortOrder}`;
        }
      } else if (this.sortConfig.sortBy === `value`) {
        elClass = `sort-icon-value-${this.sortConfig.sortOrder}`;
      }
    }
    return `sort-icon ${elClass || `sort-icon-unselected`}`;
  }
});

import { Component } from 'panel';
import throttle from 'lodash/throttle';

import * as util from '../../../../util';
import {
  nestedObjectMax,
  nestedObjectToBarChartData,
  stackedNestedObjectMax,
} from '../../chart-util';

import template from './index.jade';
import './index.styl';

import './bar-chart-header';

const SORT_ICON_WIDTH = 36;

document.registerElement(`bar-chart`, class extends Component {
  get config() {
    return {
      template,
      defaultState: {
        axisWidthStyle: {},
        chartMax: 0,
        chartLabel: ``,
        displayOptions: {},
        functionLabel: ``,
        hoverTooltip: {rowIdx: null, cellIdx: null, mouseXPos: null},
        headers: [],
        headersStyle: [],
        headerSortPanel: null,
        rows: [],
        segmentColorMap: {},
        showValueNames: [],
        util,
      },
      helpers: {
        formatLabel: (header, value) => {
          switch (header) {
            case `$event`:
              return util.renameEvent(value);
            case `$people`:
              return util.renameProperty(value);
          }
          return util.renamePropertyValue(value);
        },
        getHeaderWidth: text => util.getTextWidth(text, `bold 14px Helvetica`) + SORT_ICON_WIDTH,
        getHeaderStyle: () => {
          const style = {};
          const stickyHeader = this.state.stickyHeader;
          if (stickyHeader && stickyHeader.isSticky) {
            style.width = `${stickyHeader.chartWidth}px`;
            style.left = `${stickyHeader.chartOffsetLeft - stickyHeader.windowScrollLeft}px`;
          }
          return style;
        },
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
        mousedOverSegment: throttle((ev, rowIdx, cellIdx) => {
          if (ev.target.classList.contains(`show-tool-tip-on-hover`)) {
            let hoverTooltip = this.state.hoverTooltip;
            // start with min dimensions until the tooltip renders
            const tooltipWidth = hoverTooltip.tooltipWidth || 200;
            const tooltipHeight = hoverTooltip.tooltipHeight || 70;

            const cursorSpace = 10;
            const {left, top, width} = this.parentChartContainer.getBoundingClientRect();

            // determine x-position
            const distanceFromChartRight = (left + width) - (ev.pageX + tooltipWidth);
            const distanceFromChartLeft = ev.pageX - left;
            const tooltipRightDistance = ev.offsetX + cursorSpace;
            const tooltipLeftDistance = ev.offsetX - tooltipWidth + cursorSpace;
            const doesNotFitInsideChartLeft = (distanceFromChartLeft - tooltipWidth) < 0;
            const fitsInChartRight = (distanceFromChartRight > (tooltipWidth / 4));
            const leftPos = (fitsInChartRight || doesNotFitInsideChartLeft) ? tooltipRightDistance : tooltipLeftDistance;

            // determine y-position
            const bufferHeight = tooltipHeight * 3;
            const tooltipAboveDistance = (ev.offsetY / 2) - cursorSpace;
            const tooltipBelowDistance = (ev.offsetY / 2) + (cursorSpace * 3) + tooltipHeight;
            const tooCloseToChartTop = ev.clientY - tooltipAboveDistance - tooltipHeight - top < bufferHeight;
            const tooCloseToViewportTop = ev.clientY < bufferHeight;
            const topPos = (tooCloseToChartTop || tooCloseToViewportTop) ? tooltipBelowDistance : tooltipAboveDistance;

            hoverTooltip = util.extend(hoverTooltip, {
              cellIdx,
              leftPos,
              rowIdx,
              showTooltip: true,
              topPos,
            });

            this.update({hoverTooltip});
          } else {
            this.update({hoverTooltip: util.extend(this.state.hoverTooltip, {showTooltip: false})});
          }
        }, 50, {leading: true, trailing: false}),
        onMouseLeave: () => this.update({hoverTooltip: {}}),
        insertedTooltip: vnode => {
          const tooltipEl = vnode.elm.childNodes[0];
          this.update({hoverTooltip:
            util.extend(this.state.hoverTooltip, {
              tooltipWidth: tooltipEl.offsetWidth,
              tooltipHeight: tooltipEl.offsetHeight,
            }),
          });
        },
        sortChange: ev => ev.detail && this.dispatchEvent(new CustomEvent(`change`, {detail: ev.detail})),
        renameLabel: header => header === `$event` ? `Event` : `All People`,
      },
    };
  }

  attachedCallback() {
    super.attachedCallback(...arguments);
    for (let el = this.parentNode; el.parentNode && !this.parentChartContainer; el = el.parentNode) {
      this.parentChartContainer = el.classList.contains(`main-chart`) && el;
    }
    // TODO: research why attributeChangedCallback is not called before component
    // is attached only in full webcomponents polyfill (and not lite version)
    this.updateChartState();
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === `sticky-header`) {
      // TODO: dont use serialized JSON (talk to Ted)
      this.update({stickyHeader: JSON.parse(newValue)});
    } else {
      this.updateChartState();
    }
  }

  updateHeaderWidths() {
    window.requestAnimationFrame(() => { // defer so we can inspect the fully-rendered table
      const tableHeaderColumns = Array.from(this.querySelectorAll(`table tbody tr:first-child td.chart-header`));
      const headersStyle = tableHeaderColumns.map((el, idx) => ({name: this.state.headers[idx], width: el.offsetWidth}));

      const headerWidths = headersStyle && headersStyle.reduce((sum, header) => sum + header.width, 0);
      const axisWidthStyle = `calc(100% - ${headerWidths}px)`;
      this.update({
        axisWidthStyle,
        headersStyle,
      });
    });
  }

  updateChartState() {
    if (!this.chartData || !this.initialized) {
      return;
    }

    let {headers, series} = this.chartData;
    const segmentColorMap = this.getJSONAttribute(`segment-color-map`) || {};
    let chartLabel = this.getJSONAttribute(`chart-label`) || ``;
    const legendChangeID = this.getJSONAttribute(`legend-change-id`);
    const displayOptions = this.getJSONAttribute(`display-options`) || {};
    const functionLabel = this.getJSONAttribute(`function-label`) || ``;
    let sortConfig = this.getJSONAttribute(`sorting`);
    let stickyHeader = this.getJSONAttribute(`sticky-header`);

    if (!this.validSortConfig(headers, sortConfig)) {
      return;
    }

    if (functionLabel) {
      chartLabel = `${chartLabel} ${functionLabel}`;
    }

    series = util.nestedObjectSum(series);
    const rows = nestedObjectToBarChartData(series, sortConfig);

    const chartMax = displayOptions.plotStyle === `stacked` ? stackedNestedObjectMax(series) : nestedObjectMax(series);
    const chartRowMax = Math.max(...rows.map(series => util.sum(series[series.length - 1])));

    sortConfig = util.extend(sortConfig, {hideFirstSort: displayOptions.plotStyle === `stacked` && rows.length === 1});


    // prevent glitching widths by waiting until render on new column counts
    let headersStyle = this.state.headersStyle;
    const numOfHeaders = headers && headers.length;
    const numOfHeadersStyles = headersStyle && headersStyle.length;
    if (numOfHeaders !== numOfHeadersStyles) {
      headersStyle = null;
    }

    this.update({
      chartLabel,
      chartMax,
      chartRowMax,
      displayOptions,
      functionLabel,
      headers,
      headersStyle,
      legendChangeID,
      rows,
      segmentColorMap,
      sortConfig,
      stickyHeader,
    });

    this.updateHeaderWidths();
  }

  validSortConfig(headers, sortConfig) {
    return sortConfig && (
      sortConfig.sortBy === `value` ||
      sortConfig.colSortAttrs.length === headers.length
    );
  }

  get chartData() {
    return this._chartData;
  }

  set chartData(data) {
    this._chartData = data;
    this.updateChartState();
  }
});

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
        onMouseEnterAndMove: throttle((ev, rowIdx, cellIdx) => {
          const hoverTooltip = util.extend(this.state.hoverTooltip, {rowIdx, cellIdx, mouseXPos: ev.offsetX});
          this.update({hoverTooltip});
        }, 50, {leading: true, trailing: false}),
        onMouseLeave: () => {
          this.update({hoverTooltip: util.extend(this.state.hoverTooltip, {rowIdx: null, cellIdx: null, mouseXPos: null})});
        },
        sortChange: ev => ev.detail && this.dispatchEvent(new CustomEvent(`change`, {detail: ev.detail})),
      },
    };
  }

  attachedCallback() {
    super.attachedCallback(...arguments);
    // TODO: research why attributeChangedCallback is not called before component
    // is attached only in full webcomponents polyfill (and not lite version)
    this.updateStateFromAttributes();
  }

  attributeChangedCallback() {
    this.updateStateFromAttributes();
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

  updateStateFromAttributes() {
    let {headers, series} = this.getJSONAttribute(`data`);
    const segmentColorMap = this.getJSONAttribute(`segment-color-map`) || {};
    let chartLabel = this.getJSONAttribute(`chart-label`) || ``;
    const legendChangeID = this.getJSONAttribute(`legend-change-id`);
    const displayOptions = this.getJSONAttribute(`display-options`) || {};
    const functionLabel = this.getJSONAttribute(`function-label`) || ``;
    let sortConfig = this.getJSONAttribute(`sorting`);

    if (!this.validSortConfig(headers, sortConfig)) {
      return;
    }

    if (functionLabel) {
      chartLabel = `${chartLabel} ${functionLabel}`;
    }

    series = util.nestedObjectSum(series);
    const rows = nestedObjectToBarChartData(series, sortConfig);

    const chartMax = displayOptions.plotStyle === `stacked` ? stackedNestedObjectMax(series) : nestedObjectMax(series);

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
      displayOptions,
      functionLabel,
      headers,
      headersStyle,
      legendChangeID,
      rows,
      segmentColorMap,
      sortConfig,
    });

    this.updateHeaderWidths();
  }

  validSortConfig(headers, sortConfig) {
    return sortConfig && (
      sortConfig.sortBy === `value` ||
      sortConfig.colSortAttrs.length === headers.length
    );
  }
});

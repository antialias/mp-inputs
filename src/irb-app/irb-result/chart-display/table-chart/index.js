/* global $ */

import { Component } from 'panel';
import WebComponent from 'webcomponent';

import * as util from '../../../../util';
import {
  nestedObjectToTableData,
  transpose,
} from '../../chart-util';

import template from './index.jade';
import './index.styl';

document.registerElement(`table-chart`, class extends Component {
  get config() {
    return {
      template,
      defaultState: {
        headers: [],
        rows: [],
        columnHeaders: [],
        columnRows: [],
        displayOptions: {},
        singleValueColumnSum: null,
        util,
      },

      helpers: {
        clickHeader: (headerType, colIdx, colName) => {
          this.dispatchEvent(new CustomEvent(`change`, {detail: {
            headerType, colIdx, colName,
          }}));
        },

        leftSortArrowClasses: idx => {
          if (this.sortConfig.sortBy === `column`) {
            return [
              `sort-active`,
              `sort-${this.sortConfig.colSortAttrs[idx].sortOrder}`,
            ];
          } else {
            return [];
          }
        },

        rightSortArrowClasses: header => {
          if (this.sortConfig.sortBy === `value` && this.sortConfig.sortColumn === header) {
            return [
              `sort-active`,
              `sort-${this.sortConfig.sortOrder}`,
            ];
          } else {
            return [];
          }
        },
      },
    };
  }

  attributeChangedCallback() {
    let {headers, series, resourceDescription} = this.getJSONAttribute(`data`);
    const displayOptions = this.getJSONAttribute(`display-options`);
    const sortConfig = this.getJSONAttribute(`sorting`);
    if (!this.validSortConfig(headers, sortConfig)) {
      return;
    }
    this.sortConfig = sortConfig;

    series = util.nestedObjectSum(series);

    let columnHeaders;
    let columnRows;
    let rows = nestedObjectToTableData(series, sortConfig);
    const rowData = rows.map(row => row.slice(-1)[0]); // last item of each row is data
    rows = rows.map(row => row.slice(0, -1)); // strip off data items

    if (headers.length > 1) {
      headers = headers.slice(0, -1);
      columnHeaders = util.nestedObjectKeys(series)
        .sort()
        .map(header => ({display: header, value: header}));
      columnRows = rowData.map(row =>
        columnHeaders.map(header => row[header.value])
      );
    } else {
      columnHeaders = [{display: resourceDescription, value: `value`}];
      columnRows = rowData.map(row => [row.value]);
    }

    // add table zebra-striping
    transpose(rows).forEach(column => {
      let odd = false;
      column.filter(Boolean).forEach(cell => {
        cell.odd = odd = !odd;
      });
    });

    const singleValueColumnSum = columnHeaders.length === 1 ? util.sum(Object.values(series)) : null;

    this.update({
      headers,
      rows,
      columnHeaders,
      columnRows,
      displayOptions,
      singleValueColumnSum,
    });
  }

  validSortConfig(headers, sortConfig) {
    if (!sortConfig) {
      return false;
    }

    if (headers.length > 1) {
      headers = headers.slice(0, -1);
    }

    if (sortConfig.sortBy === `value`) {
      return !!sortConfig.sortColumn;
    } else {
      return sortConfig.colSortAttrs.length === headers.length;
    }
  }
});

document.registerElement(`table-manager`, class extends WebComponent {
  attachedCallback() {
    this.scrollHandler = ev => {
      const $target = $(ev.target);
      const scrollX = $target.scrollLeft();
      const scrollY = $target.scrollTop();

      this.$container.toggleClass(`scrolled-y`, !!scrollY);

      if ($target.hasClass(`right-table`)) {
        this.$container.toggleClass(`scrolled-x`, !!scrollX);

        // vertically scroll left table as right table is scrolled
        this.$left.scrollTop(scrollY);

        // horizontally scroll fixed header as right table is scrolled
        this.$rightFixedHeader.css(`transform`, `translateX(-${scrollX}px)`); //
      }
    };
  }

  attributeChangedCallback() {
    if (this._initialized) {
      this.render();
    }
  }

  detachedCallback() {
    this.$left.off(`scroll`, this.scrollHandler);
    this.$right.off(`scroll`, this.scrollHandler);
  }

  render() {
    this._initialized = true;
    this.$container = $(this).parent();
    this.$left = this.$container.find(`.left-table`);
    this.$right = this.$container.find(`.right-table`);
    this.$leftFixedHeader = this.$left.siblings(`.fixed-header`);
    this.$rightFixedHeader = this.$right.siblings(`.fixed-header`);

    this.$right.width(this.$container.width() - this.$left.children(`table`).width());
    this.$right.on(`scroll`, this.scrollHandler);
    this.$left.on(`scroll`, this.scrollHandler);

    const $leftHeaders = this.$left.find(`th`);
    const $leftFixedHeaders = this.$leftFixedHeader.children();

    const isFirefox = navigator.userAgent.toLowerCase().indexOf(`firefox`) > -1;

    $leftHeaders.each((i, el) => {
      const adjust = isFirefox ? 2 : 1;
      const width = $(el).width() - (i === $leftHeaders.length - 1 ? adjust : 0) + (1 - adjust);
      $leftFixedHeaders.eq(i).width(width);
    });

    const $rightHeaders = this.$right.find(`th`);
    const $rightFixedHeaders = this.$rightFixedHeader.children();

    $rightHeaders.each((i, el) => {
      const adjust = isFirefox ? 2 : 0;
      $rightFixedHeaders.eq(i).width($(el).width() - adjust);
    });
  }

  get data() {
    return this._data;
  }

  set data(data) {
    this._data = JSON.parse(data);
    // allow time for table to fully render so we can check width
    window.requestAnimationFrame(() => this.render());
  }
});
/* global $ */

import { Component } from 'panel';
import WebComponent from 'webcomponent';

import * as util from '../../../util';
import {
  nestedObjectPaths,
  nestedObjectToTableRows,
  transpose,
} from '../chart-util';

import template from './index.jade';
import './index.styl';

document.registerElement('table-chart', class extends Component {
  get config() {
    return {
      template,
      defaultState: {
        headers: [],
        rows: [],
        columnHeaders: [],
        columnRows: [],
        util,
      },
    };
  }

  attributeChangedCallback() {
    let { headers, series, resourceDescription } = JSON.parse(this.getAttribute('data'));

    series = util.nestedObjectSum(series);

    let rows = [];
    let columnHeaders = [];
    let columnRows = [];

    if (headers.length <= 1) { // 2 column table with no grouping
      headers = headers.concat([resourceDescription]);
      rows = nestedObjectPaths(series).map(row => row.map(value => ({value})));

    } else if (headers.length > 1) { // nested table with last group spread over columns
      headers = headers.slice(0, -1);
      rows = nestedObjectToTableRows(series, 1);

      const rowData = rows.map(row => row.slice(-1)[0].value); // last item of each row is data
      rows = rows.map(row => row.slice(0, -1)); // strip off data items

      columnHeaders = util.nestedObjectKeys(series).sort();
      columnRows = rowData.map(row =>
        columnHeaders.map(key => row[key])
      );
    }

    // add table zebra-striping
    transpose(rows).forEach(column => {
      let odd = false;
      column.filter(Boolean).forEach(cell => {
        cell.odd = odd = !odd;
      });
    });

    this.update({
      headers,
      rows,
      columnHeaders,
      columnRows,
    });
  }
});

document.registerElement('table-manager', class extends WebComponent {
  attachedCallback() {
    this.scrollHandler = ev => {
      const $target = $(ev.target);
      const scrollX = $target.scrollLeft();
      const scrollY = $target.scrollTop();

      this.$container.toggleClass('scrolled-y', !!scrollY);

      if ($target.hasClass('right-table')) {
        this.$container.toggleClass('scrolled-x', !!scrollX);

        // vertically scroll left table as right table is scrolled
        this.$left.scrollTop(scrollY);

        // horizontally scroll fixed header as right table is scrolled
        this.$rightFixedHeader.css('transform', `translateX(-${scrollX}px)`); //
      }
    };
  }

  detachedCallback() {
    this.$left.off('scroll', this.scrollHandler);
    this.$right.off('scroll', this.scrollHandler);
  }

  render() {
    this.$container = $(this).parent();
    this.$left = this.$container.find('.left-table');
    this.$right = this.$container.find('.right-table');
    this.$leftFixedHeader = this.$left.siblings('.fixed-header');
    this.$rightFixedHeader = this.$right.siblings('.fixed-header');

    this.$right.width(this.$container.width() - this.$left.children('table').width());
    this.$right.on('scroll', this.scrollHandler);
    this.$left.on('scroll', this.scrollHandler);

    const $leftHeaders = this.$left.find('th');
    const $leftFixedHeaders = this.$leftFixedHeader.children();

    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    $leftHeaders.each((i, el) => {
      const adjust = isFirefox ? 2 : 1;
      const width = $(el).width() - (i === $leftHeaders.length - 1 ? adjust : 0) + (1 - adjust);
      $leftFixedHeaders.eq(i).width(width);
    });

    const $rightHeaders = this.$right.find('th');
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

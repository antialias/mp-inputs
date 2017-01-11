/* global $ */

import { Component } from 'panel';

import * as util from '../../../../../util';

import template from './index.jade';

const SORT_ICONS = {
  label: `alpha`,
  value: `value`,
};

document.registerElement(`irb-bar-chart-header`, class extends Component {
  get config() {
    return {
      defaultState: {
        activeSortPanel: null,
        headers: [],
      },
      helpers: {
        SORT_ICONS,
        clickedHeader: (section) => this.update({activeSortPanel: section}),
        renameHeaderLabel: (header) => header === `$event` ? `Events` : util.renameProperty(header),
        selectedHeaderSort: (type, colIdx, sortBy, sortOrder) => this.dispatchEvent(new CustomEvent(`change`, {
          detail: {
            colIdx,
            sortBy,
            sortOrder,
            type,
          },
        })),
      },
      template,
    };
  }

  createdCallback() {
    super.createdCallback(...arguments);
    this.chartLabel = ``;
    this.chartMax = null;
    this.displayOptions = {};
    this.functionLabel = ``;
    this.headers = [];
    this.sortConfig = {};
  }

  attributeChangedCallback() {
    super.attributeChangedCallback(...arguments);
    this.chartMax = this.getJSONAttribute(`chart-max`);
    this.displayOptions = this.getJSONAttribute(`display-options`) || {};
    this.headers = this.getJSONAttribute(`headers`) || [];
    this.sortConfig = this.getJSONAttribute(`sort-config`) || {};


    let chartLabel = this.getJSONAttribute(`chart-label`);
    const functionLabel = this.getJSONAttribute(`function-label`);
    if (functionLabel) {
      chartLabel = `${chartLabel} ${functionLabel}`;
    }


    window.requestAnimationFrame(() => { // defer so we can inspect the fully-rendered table

      const headers = $(this).parents(`table`)
        .find(`tbody tr:first-child td`).map((i, el) => ({
          name: this.headers[i],
          width: $(el).outerWidth(),
        })).get().slice(0, -1);

      const headerWidths = headers.reduce((sum, header) => sum + header.width, 0);
      const axisWidthStyle = (`calc(100% - ${headerWidths}px)`);

      this.update({
        axisWidthStyle,
        headers,
        chartLabel,
      })
    });
  }

  selectHeaderSort(type, colIdx, sortBy, sortOrder) {
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
    // this.sortHolders = [];
    // let headersEl = this;

    // let headers = this.headers.map((header, idx) => {
    //   const sortHolder = this.createSortHolder(`colSort`, [`label`, `value`], [`asc`, `desc`], idx);
    //   this.sortHolders.push(sortHolder);
    //   return $(`<div>`)
    //     .addClass(`bar-chart-header`)
    //     .data(`header-idx`, idx)
    //     .on(`click`, () => {
    //       this.hideAllSortHolders(sortHolder);
    //       sortHolder.toggleClass(`active-sort-panel`);
    //     })
    //     .append($(`<div>`).addClass(`text`).html(
    //       header === `$event` ? `Events` : util.renameProperty(header)
    //     ))
    //     .append($(`<div class="sort-icon sort-bar-header">`).append(headersEl.createSortIcon(idx)))
    //     .append(sortHolder)
    //     .get(0);
    // });

    // this.$el
    //   .addClass(`loading`)
    //   .append($headers);

    // let chartTitle = this.chartLabel;
    // if (this.functionLabel) {
    //   chartTitle += ` ${this.functionLabel}`;
    // }

    // const sortAxisHolder = this.createSortHolder(`axisSort`, [`value`], [`asc`, `desc`]);
    // this.sortHolders.push(sortAxisHolder);
    // const $axisTitle = $(`<div>`)
    //   .addClass(`axis-title`)
    //   .append($(`<div>`).addClass(`text`).html(chartTitle))
    //   .append($(`<div class="sort-icon sort-axis">`).append(headersEl.createAxisSortIcon()))
    //   .append(sortAxisHolder);

    // const $axisMaxValue = $(`<div>`)
    //   .addClass(`text`)
    //   .on(`click`, function(ev) {
    //     headersEl.dispatchEvent(new CustomEvent(`change`, {detail: {axis: true, maxValueText: true}}));
    //     ev.stopPropagation();
    //   })
    //   .html(this.displayOptions.value === `absolute` ? util.abbreviateNumber(this.chartMax) : `%`);

    // let $axis = $(`<div class="bar-chart-axis"></div>`)
    //   .on(`click`, () => {
    //     this.hideAllSortHolders(sortAxisHolder);
    //     sortAxisHolder.toggleClass(`active-sort-panel`);
    //   })
    //   .append($axisTitle)
    //   .append($(`<div>`).addClass(`max-value`).append($axisMaxValue));

    // this.$el.append($axis);

    // window.requestAnimationFrame(() => { // defer so we can inspect the fully-rendered table
    //   const tableColWidths = this.$el.parents(`table`)
    //     .find(`tbody tr:first-child td`).map((i, el) => $(el).outerWidth()).get();

    //   // set header widths
    //   $headers.each((i, el) => {
    //     $(el).width(tableColWidths[i]);
    //   });

    //   // set axis width
    //   const headerWidths = tableColWidths.slice(0, -1).reduce((sum, width) => sum + width, 0);
    //   $axis.width(`calc(100% - ${headerWidths}px)`);
    //   this.$el.removeClass(`loading`);
    // });
  }

  createSortIcon(headerIdx) {
    let sortEl = null;
    if (
      this.sortConfig &&
      this.sortConfig.sortBy === `column` &&
      !(this.sortConfig.hideFirstSort && headerIdx === 0)
    ) {
      const colAttrs = this.sortConfig.colSortAttrs[headerIdx];
      if (colAttrs) {
        sortEl = $(`<svg-icon icon="sort-${SORT_ICONS[colAttrs.sortBy]}-${colAttrs.sortOrder}">`);
      }
    }
    return sortEl || $(`<svg-icon empty>`);
  }

  createAxisSortIcon() {
    let sortEl = null;
    if (this.sortConfig) {
      if (this.sortConfig.colSortAttrs && this.displayOptions && this.displayOptions.plotStyle === `stacked`) {
        const headerIdx = this.sortConfig.hideFirstSort ? 0 : this.headers.length;
        const colAttrs = this.sortConfig.colSortAttrs[headerIdx];
        if (colAttrs) {
          sortEl = $(`<svg-icon icon="sort-${SORT_ICONS[colAttrs.sortBy]}-${colAttrs.sortOrder}">`);
        }
      } else if (this.sortConfig.sortBy === `value`) {
        sortEl = $(`<svg-icon icon="sort-value-${this.sortConfig.sortOrder}">`);
      }
    }
    return sortEl || $(`<svg-icon empty>`);
  }
});

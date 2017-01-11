/* global $ */

import { Component } from 'panel';

import { abbreviateNumber, renameProperty } from '../../../../../util';

import template from './index.jade';
import './index.styl';

const SORT_ICONS = {
  label: `alpha`,
  value: `value`,
};

document.registerElement(`irb-bar-chart-header`, class extends Component {
  get config() {
    return {
      defaultState: {
        activeSortPanel: null,
        chartLabel: ``,
        chartMax: null,
        displayOptions: {},
        functionLabel: ``,
        headers: [],
        sortConfig: {},
      },
      helpers: {
        SORT_ICONS,
        clickedHeader: section => {
          const activeSortPanel = section === this.state.activeSortPanel ? null : section;
          this.update({activeSortPanel});
        },
        clickedMaxValue: ev => {
          ev.stopPropagation();
          this.dispatchEvent(new CustomEvent(`change`, {detail: {axis: true, maxValueText: true}}));
        },
        getAxisSortIcon: () => {
          let icon = ``;
          if (this.state.sortConfig) {
            if (this.state.sortConfig.colSortAttrs && this.state.displayOptions && this.state.displayOptions.plotStyle === `stacked`) {
              const headerIdx = this.state.sortConfig.hideFirstSort ? 0 : this.state.headers.length;
              const colAttrs = this.state.sortConfig.colSortAttrs[headerIdx];
              if (colAttrs) {
                icon = `sort-${SORT_ICONS[colAttrs.sortBy]}-${colAttrs.sortOrder}`;
              }
            } else if (this.state.sortConfig.sortBy === `value`) {
              icon = `sort-value-${this.state.sortConfig.sortOrder}`;
            }
          }
          return icon;
        },
        getHeaderSortActive: headerIdx => {
          let icon = ``;
          const sortConfig = this.state.sortConfig;
          if (sortConfig && sortConfig.sortBy === `column` && !(sortConfig.hideFirstSort && headerIdx === 0)) {
            const colAttrs = sortConfig.colSortAttrs[headerIdx];
            if (colAttrs) {
              icon = `sort-${SORT_ICONS[colAttrs.sortBy]}-${colAttrs.sortOrder}`;
            }
          }
          return icon;
        },
        getMaxValueLabel: () => this.state.displayOptions.value === `absolute` ? abbreviateNumber(this.state.chartMax) : `%`,
        renameHeaderLabel: header => header === `$event` ? `Events` : renameProperty(header),
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

  attributeChangedCallback() {
    super.attributeChangedCallback(...arguments);
    const chartMax = this.getJSONAttribute(`chart-max`);
    const displayOptions = this.getJSONAttribute(`display-options`) || {};
    const headerNames = this.getJSONAttribute(`headers`) || [];
    const sortConfig = this.getJSONAttribute(`sort-config`) || {};


    let chartLabel = this.getJSONAttribute(`chart-label`);
    const functionLabel = this.getJSONAttribute(`function-label`);
    if (functionLabel) {
      chartLabel = `${chartLabel} ${functionLabel}`;
    }

    window.requestAnimationFrame(() => { // defer so we can inspect the fully-rendered table

      const headers = $(this).parents(`table`)
        .find(`tbody tr:first-child td`).map((i, el) => ({
          name: headerNames[i],
          width: $(el).outerWidth(),
        })).get().slice(0, -1);

      const headerWidths = headers.reduce((sum, header) => sum + header.width, 0);
      const axisWidthStyle = (`calc(100% - ${headerWidths}px)`);

      this.update({
        axisWidthStyle,
        chartLabel,
        chartMax,
        displayOptions,
        headers,
        sortConfig,
      });
    });
  }
});

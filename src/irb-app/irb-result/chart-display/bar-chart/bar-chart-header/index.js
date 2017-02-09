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
        isSortSelected: (colAccessor, sortBy, sortOrder) => {
          let sortConfig = this.state.sortConfig;
          if (isFinite(colAccessor)) {
            sortConfig = sortConfig.colSortAttrs[colAccessor];
          }
          return sortConfig.sortBy === sortBy && sortConfig.sortOrder === sortOrder;
        },
        menuChange: (ev, idx) => {
          if (ev.detail && ev.detail.state === `closed` && this.state.activeSortPanel === idx) {
            this.update({activeSortPanel: null});
          }
        },
        renameHeaderLabel: header => header === `$event` ? `Events` : renameProperty(header),
        selectedHeaderSort: (type, colIdx, sortBy, sortOrder) => {
          this.dispatchEvent(
            new CustomEvent(`change`, { detail: {colIdx, sortBy, sortOrder, type}})
          );
          this.update({activeSortPanel: null});
        },
      },
      template,
    };
  }

  shouldUpdate(state) {
    return !!(this.state.sortConfig || state.sortConfig);
  }
});

import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { Component } from 'panel';
import { capitalize } from 'mixpanel-common/util';

import {
  extend,
  filterObject,
  mapObjectKeys,
  pick,
  renameEvent,
} from '../../../util';

import './chart-legend';
import './bar-chart';
import './line-chart';
import './table-chart';

import template from './index.jade';
import './index.styl';

const ROLLING_WINDOWS_BY_UNIT = {
  hour: 12,
  day: 7,
  week: 5,
  month: 3,
  quarter: 2,
};

function reverseSortOrder(order) {
  return order === `desc` ? `asc` : `desc`;
}

document.registerElement(`chart-display`, class extends Component {
  get config() {
    return {
      helpers: {
        getChartLabel: () => {
          let chartLabel = [`number of`];
          const mathTypes = Array.from(new Set(this.state.report.sections.show.clauses.map(clause => clause.math)));
          if (mathTypes && mathTypes.length === 1) {
            chartLabel.unshift(mathTypes[0]);
          }

          const showValueNames = this.config.helpers.getShowValueNames();
          const headers = this.state.result.headers;
          if (headers.length === 1 && headers[0] !== `$event` && showValueNames.length === 1) {
            chartLabel.push(showValueNames[0]);
          }

          return capitalize(chartLabel.join(` `));
        },
        getDisplayOptions: () => extend(
          pick(this.state.report.displayOptions, [`analysis`, `plotStyle`, `value`]),
          {timeUnit: this.state.report.sections.time.clauses[0].unit}
        ),
        getFunctionLabel: () => {
          switch (this.config.helpers.getDisplayOptions().analysis) {
            case `logarithmic`:
              return `(Logarithmic - base 10)`;
            case `cumulative`:
              return `(Cumulative)`;
            case `rolling`: {
              const unit = this.state.report.sections.time.clauses[0].unit;
              return `(Rolling - ${ROLLING_WINDOWS_BY_UNIT[unit]} ${unit})s`;
            }
          }
          // nothing for 'linear'
          return null;
        },
        getShowValueNames: () => this.state.report.sections.show.clauses.map(clause => renameEvent(clause.value.name)),
        getUniqueShowMathTypes: () => new Set(this.state.report.sections.show.clauses.map(clause => clause.math)),
        stringifyObjValues: obj => mapObjectKeys(obj, JSON.stringify),
        showLegend: () => {
          const chartName = this.IRBResult.selectedChartName().toLowerCase(); // TODO
          const showClauses = this.state.report.sections.show.clauses;
          const groupClauses = this.state.report.sections.group.clauses;
          let shouldShow = false;

          if (chartName.includes(`bar`)) {
            shouldShow = groupClauses.length > 0 || (chartName === `stacked bar` && showClauses.length > 1);
          } else if (chartName.includes(`line`)) {
            shouldShow = groupClauses.length > 0 || showClauses.length > 1 || (chartName === `line` && showClauses[0].value.name === `$top_events`);
          }

          return shouldShow;
        },
        processResult: result => {
          result = result.transformed({
            analysis: this.state.report.displayOptions.analysis,
            windowSize: ROLLING_WINDOWS_BY_UNIT[this.state.report.sections.time.clauses[0].unit],
          });
          const isFlattenedData = this.state.report.displayOptions.chartType === `line`;
          if (this.config.helpers.showLegend()) {
            const legend = this.state.report.legend;
            legend.buildColorMap();
            result.series = filterObject(result.series, (value, depth, parentKeys) => {
              if (isFlattenedData) {
                return depth === 2 ? legend.data[0].flattenedData[parentKeys.concat(value).join(` `)] : true;
              } else {
                return depth > 1 ? legend.data[depth - 2].seriesData[value] : true;
              }
            });
          }
          return result;
        },
        barChartChange: ev => {
          if (ev.detail) {
            if (ev.detail.type) {
              const reportTrackingData = this.state.report.toTrackingData();
              const barSort = this.state.report.sorting.bar;
              const colIdx = ev.detail.colIdx;
              switch(ev.detail.type) {
                case `axisSort`:
                  barSort.sortBy = `value`;
                  barSort.sortOrder = ev.detail.sortOrder;
                  break;
                case `colSort`:
                  barSort.sortBy = `column`;
                  barSort.colSortAttrs = this.app.sortConfigFor(this.state.result, this.state.report.sorting).bar.colSortAttrs;
                  barSort.colSortAttrs[colIdx] = pick(ev.detail, [
                    `sortBy`, `sortOrder`,
                  ]);
                  break;
              }
              this.app.updateReport();
              this.trackSort(reportTrackingData, ev.detail.type, barSort, colIdx);
            } else if (ev.detail.axis && ev.detail.maxValueText) {
              const reportTrackingData = this.state.report.toTrackingData();
              const newValue = this.state.report.displayOptions.value === `absolute` ? `relative` : `absolute`;
              this.state.report.displayOptions.value = newValue;
              this.app.updateReport();
              this.app.trackEvent(
                `Chart Options - Changed Value Display`,
                extend(reportTrackingData, {
                  'from bar chart toggle': true,
                  'new analysis type': newValue,
                })
              );
            }
          }
        },
        tableChange: ev => {
          const reportTrackingData = this.state.report.toTrackingData();
          const {headerType, colIdx, colName} = ev.detail;
          const sortConfig = this.state.report.sorting.table;
          switch(headerType) {
            case `left`:
              if (sortConfig.sortBy === `column`) {
                // already sorting by group label
                const col = sortConfig.colSortAttrs[colIdx];
                col.sortOrder = reverseSortOrder(col.sortOrder);
              } else {
                // reset back to grouped sort
                this.state.report.sorting.table = this.app.sortConfigFor(this.state.result).table;
              }
              break;
            case `right`:
              if (sortConfig.sortBy === `value` && sortConfig.sortColumn === colName) {
                // already sorting by this column value
                sortConfig.sortOrder = reverseSortOrder(sortConfig.sortOrder);
              } else {
                sortConfig.sortBy = `value`;
                sortConfig.sortColumn = colName;
                sortConfig.sortOrder = `desc`;
              }
              break;
          }
          this.app.updateReport();
          this.trackSort(reportTrackingData, headerType, sortConfig, colIdx);
        },
      },
      template,
    };
  }

  trackSort(reportProperties, group, sortConfig, colIdx) {
    const eventProperties = {};
    switch (group) {
      case `colSort`:
      case `left`:
        eventProperties[`sort by`] = sortConfig.colSortAttrs[colIdx].sortBy;
        eventProperties[`sort order`] = sortConfig.colSortAttrs[colIdx].sortOrder;
        eventProperties[`sort group`] = sortConfig.sortBy;
        eventProperties[`sort column index`] = colIdx;
        break;
      case `axisSort`:
      case `right`:
        eventProperties[`sort by`] = sortConfig.sortBy;
        eventProperties[`sort order`] = sortConfig.sortOrder;
        eventProperties[`sort group`] = `axis`;
        break;
    }
    this.app.trackEvent(`Chart Options - Sort`, extend(reportProperties, eventProperties));
  }

  get IRBResult() {
    this._IRBResult = this._IRBResult || this.findPanelParentByTagName(`irb-result`);
    return this._IRBResult;
  }

  /* PERFORMANCE OPTIMIZATION --------------------------------------------------------- */
  stateToWatch(state) {
    try {
      return {
        displayOptions: cloneDeep(state.report.displayOptions),
        isEditingExtrasMenu: state.isEditingExtrasMenu,
        legendRevision: state.report.legend.revisionStr,
        resultID: state.result.id,
        showLegend: this.config.helpers.showLegend(state),
        sortConfig: cloneDeep(state.report.sorting),
        windowSize: ROLLING_WINDOWS_BY_UNIT[state.report.sections.time.clauses[0].unit],
      };
    } catch(e) {
      return {};
    }
  }

  _render() {
    const result = super._render(...arguments);
    this.currentState = this.stateToWatch(this.state);
    return result;
  }

  shouldUpdate(state) {
    this.currentState = this.currentState || {};
    return !isEqual(this.stateToWatch(state), this.currentState);
  }
  /* ---------------------------------------------------------------------------------- */
});
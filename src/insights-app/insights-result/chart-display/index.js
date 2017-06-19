import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import throttle from 'lodash/throttle';
import {Component} from 'panel';

import {
  extend,
  filterObject,
  mapObjectKeys,
  pick,
  renameEvent,
  renameProperty,
} from '../../../util';

import {Clause, TimeClause} from '../../../models/clause';

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
        getSelectedSource: () => this.app.getSelectedSource(),
        isNoDataProject: () => !this.state.projectHasEvents && !this.state.projectHasPeople,
        isLoading: () => this.state.resultLoading && !this.helpers.isNoDataProject(),
        isEmptyResult: () => this.state.result.isEmptyResult(),
        isBarChart: () => this.state.report.displayOptions.chartType === `bar`,
        isLineChart: () => this.state.report.displayOptions.chartType === `line`,
        isTableChart: () => this.state.report.displayOptions.chartType === `table`,
        isChartHeaderSticky: () => (
          this.state.stickyHeader.isSticky &&
          this.helpers.isBarChart() &&
          !this.helpers.isLoading() &&
          !this.helpers.isNoDataProject() &&
          !this.helpers.isEmptyResult()
        ),
        getChartLabel: () => {
          let chartLabel = [];
          if (this.state.report.displayOptions.value === `relative`) {
            chartLabel.push(`Percent of the group`);
          }

          let analysisType = ``;
          switch (this.helpers.getDisplayOptions().analysis) {
            case `linear`:
              analysisType = `Linear`;
              break;
            case `logarithmic`:
              analysisType = `Logarithmic - base 10`;
              break;
            case `cumulative`:
              analysisType = `Cumulative`;
              break;
            case `rolling`: {
              const unit = this.state.report.sections.time.clauses[0].unit;
              analysisType = `Rolling - ${ROLLING_WINDOWS_BY_UNIT[unit]} ${unit}s`;
              break;
            }
            default:
              return chartLabel[0];
          }

          if (chartLabel.length) {
            analysisType = `(` + analysisType + `)`;
          }
          chartLabel.push(analysisType);

          return chartLabel.join(` `);
        },
        getLegendStyle: () => {
          const style = {};
          const stickyHeader = this.state.stickyHeader;
          if (this.helpers.isChartHeaderSticky()) {
            style.left = `${stickyHeader.chartWidth + stickyHeader.chartOffsetLeft - stickyHeader.windowScrollLeft}px`;
            style.height = `calc(100vh - ${stickyHeader.chartBottomToPageBottom}px)`;
            style.position = `fixed`;
          }
          return style;
        },
        getDisplayOptions: () => {
          const options = pick(this.state.report.displayOptions, [`analysis`, `plotStyle`, `value`]);
          if (this.state.result.peopleTimeSeries) {
            const peopleTimeClause = this.state.report.sections.group.getLastClause();
            options.timeUnit = peopleTimeClause ? peopleTimeClause.unit : TimeClause.TIME_UNITS.DAY;
          } else {
            options.timeUnit = this.state.report.sections.time.clauses[0].unit;
          }
          return options;
        },
        getShowValueNames: () => this.state.report.sections.show.clauses.map(clause => {
          if (clause.type === Clause.RESOURCE_TYPE_EVENTS) {
            return renameEvent(clause.value.name);
          }
          return renameProperty(clause.value.name);
        }),
        getUniqueShowMathTypes: () => new Set(this.state.report.sections.show.clauses.map(clause => clause.math)),
        getUtcOffset: () => this.app.mpContext.utcOffset,
        stringifyObjValues: obj => mapObjectKeys(obj, JSON.stringify),
        showLegend: () => {
          const chartName = this.insightsResult.selectedChartName().toLowerCase(); // TODO
          const showClauses = this.state.report.sections.show.clauses;
          const groupClauses = this.state.report.sections.group.clauses;
          let shouldShow = false;

          if (/bar/.test(chartName)) {
            shouldShow = groupClauses.length > 0 || (chartName === `stacked bar` && showClauses.length > 1);
          } else if (/line/.test(chartName)) {
            const minGroupClauses = this.state.result.peopleTimeSeries ? 1 : 0;
            shouldShow = showClauses.length > 1 || groupClauses.length > minGroupClauses || showClauses[0].value.name === `$top_events`;
          }

          return shouldShow;
        },
        processResult: (result, {flattenedData=false}={}) => {
          result = result.transformed({
            analysis: this.state.report.displayOptions.analysis,
            windowSize: ROLLING_WINDOWS_BY_UNIT[this.state.report.sections.time.clauses[0].unit],
          });
          const processed = pick(result, [`series`, `headers`]);
          if (flattenedData) {
            processed.series = result.peopleTimeSeries || result.series;
            processed.dataId = result.id;
          } else if (this.helpers.showLegend()) {
            const legend = this.state.report.legend;
            processed.series = filterObject(result.series, (value, depth) => (
              depth > 1 ? legend.data[depth - 2].seriesData[value] : true
            ));
          }

          processed.anomalyAlerts = this.state.smartHubAlerts.filter(smartHubAlert => {
            const anomaly = smartHubAlert.anomaly;
            return anomaly && anomaly.insightsDetails;
          });

          return processed;
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
        barChartInserted: vdom => {
          const getDistToBottomFrom = el => (
            Math.abs(Math.max(0, window.innerHeight - el.top - el.height))
          );

          this._updateChartBoundaries = throttle(() => {
            const chartBounds = vdom.elm.getBoundingClientRect();
            this.app.updateStickyHeader({
              chartBottomToPageBottom: getDistToBottomFrom(chartBounds),
              chartWidth: chartBounds.width,
              chartOffsetLeft: chartBounds.left,
              windowScrollLeft: window.scrollX,
            });
          }, 10);

          this._checkForStickyHeader = throttle(() => {
            const chartBounds = vdom.elm.getBoundingClientRect();
            const stickyHeader = {
              chartBottomToPageBottom: getDistToBottomFrom(chartBounds),
              isSticky: chartBounds.top <= 0,
              windowScrollLeft: window.scrollX,
            };

            if (stickyHeader.isSticky !== this.state.stickyHeader.isSticky ||
              stickyHeader.chartBottomToPageBottom !== this.state.stickyHeader.chartBottomToPageBottom ||
              stickyHeader.windowScrollLeft !== this.state.stickyHeader.windowScrollLeft
            ) {
              // scroll event happens alot. only update if there are changes.
              this.app.updateStickyHeader(stickyHeader);
            }
          }, 10);

          window.requestAnimationFrame(() => {
            this._updateChartBoundaries();
            this._checkForStickyHeader();
          });
          window.addEventListener(`resize`, this._updateChartBoundaries);
          window.addEventListener(`scroll`, this._checkForStickyHeader);
        },
        barChartDestroyed: () => {
          this.update({stickyHeader: {}});
          window.removeEventListener(`resize`, this._updateChartBoundaries);
          window.removeEventListener(`scroll`, this._checkForStickyHeader);
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

  get insightsResult() {
    this._insightsResult = this._insightsResult || this.findPanelParentByTagName(`insights-result`);
    return this._insightsResult;
  }

  /* PERFORMANCE OPTIMIZATION --------------------------------------------------------- */
  stateToWatch(state) {
    try {
      return {
        displayOptions: cloneDeep(state.report.displayOptions),
        isEditingExtrasMenu: state.isEditingExtrasMenu,
        legendRevision: state.report.legend.revisionStr,
        resultID: state.result.id,
        resultLoading: state.resultLoading,
        showLegend: this.helpers.showLegend(state),
        stickyHeader: state.stickyHeader,
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

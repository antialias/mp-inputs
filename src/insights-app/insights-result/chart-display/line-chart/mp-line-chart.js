/* global Highcharts */
import isEqual from 'lodash/isEqual';
import partition from 'lodash/partition';
import WebComponent from 'webcomponent';

import * as util from '../../../../util';
// TODO(mack): Expose the icons on the mp-smart-hub-alerts component
import anomalyUpIcon from 'mixpanel-common/lib/widgets/smart-hub-alert/smart-hub-assets/anomaly-up.svg';
import anomalyDownIcon from 'mixpanel-common/lib/widgets/smart-hub-alert/smart-hub-assets/anomaly-down.svg';

import {
  multiPartSortComparator,
} from '../../../../util/chart';
import {
  dataObjectToSortedSeries,
  generateChangeId,
  killLastGridline,
} from '../../../../util/chart/line';

import commonCSS from '!!style!css?camelCase!stylus!../../../../stylesheets/common.styl';

const LOGARITHMIC_CHART_ZERO_REMAPPING = 0.6;

Highcharts.setOptions({
  global: {
    useUTC: false,
  },
});

export class MPLineChart extends WebComponent {
  attachedCallback() {
    this.initialized = true;
    this.el = document.createElement(`div`);
    this.el.className = `mp-highcharts-container`;
    this.appendChild(this.el);
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    if (attrName === `seg-filters`) {
      this._segFilters = JSON.parse(newVal);
      this.updateShowHideSeries();
    } else if (attrName === `disable-chart-interactions`) {
      this._disableChartInteractions = this.getJSONAttribute(attrName);
      this.updateChartInteractions();
    }
  }

  timestampToTimeUnitFunction({displayRangeIfWeek=true}={}) {
    const unit = this._displayOptions.timeUnit;
    const customFormatting = {day: `ddd, MMM D`};
    return timestamp => util.formatDate(timestamp, {unit, displayRangeIfWeek, customFormatting});
  }

  tooltipFormatter() {
    const timeFormatter = this.timestampToTimeUnitFunction();
    const unit = this._displayOptions.timeUnit;
    const utcOffset = this.utcOffset;

    const formatSeriesName = segments => {
      return segments.map((segment, idx) => {
        return util.renamePropertyValue(segment, this._headers[idx]);
      }).join(` / `);
    };

    return function() {
      const seriesName = formatSeriesName(this.point.series.options.headerPath);
      const isIncomplete = util.isIncompleteInterval([this], {unit, utcOffset});
      const index = this.series.data.indexOf(this.point);
      let delta = null;
      // TODO: revisit design for stacked chart, which already shows proportional percentage
      if (index > 0 && !this.percentage) {
        const last = this.series.data[index - 1];
        delta = last.y > 0 ? (this.y - last.y) / last.y : null;
      }
      const percentHtml = this.percentage ? `<div class="percent">${util.formatPercent(this.percentage * .01)}</div>` : ``;
      const deltaCls = delta < 0 ? `delta-neg` : (delta > 0 ? `delta-pos` : ``);
      const deltaSign = delta > 0 ? `+` : ``;
      const deltaPercent = util.formatPercent(delta);
      const deltaHtml = delta !== null ? `<div class="delta ${deltaCls}">${deltaSign}${deltaPercent}</div>` : ``;
      const footerHtml = isIncomplete ? `<div class="footer">Incomplete ${unit}</div>` : ``;
      return `
        <div class="title" style="background-color: ${this.series.color};">${util.truncateMiddle(seriesName, 45)}</div>
        <div class="results">
          <div class="absolute">
            <span class="date">${timeFormatter(this.key)}: </span>
            <span class="count">${util.commaizeNumber(this.y)}</span>
          </div>
          ${percentHtml}
          ${deltaHtml}
        </div>
        ${footerHtml}
      `;
    };
  }

  xAxisFormatter() {
    var timeFormatter = this.timestampToTimeUnitFunction({displayRangeIfWeek: false});
    return function() {
      return timeFormatter(Number(this.value));
    };
  }

  yAxisFormatter() {
    return function() {
      return this.value < 10000 ? util.commaizeNumber(this.value) : util.abbreviateNumber(this.value);
    };
  }

  defaultHighchartsOptions() {
    const axisOptions = {
      endOnTick: false,
      lineWidth: 1,
      lineColor: commonCSS.grey150,
      minPadding: 0,
      maxPadding: 0,
      startOnTick: true,
    };
    return {
      chart: {
        backgroundColor: `rgba(255,255,255,0)`,
        borderRadius: 0,
        events: {
          redraw: killLastGridline,
          click: ev => {
            // This is necessary to bubble the event to ancestors. I think it's because the original click
            // event is triggered within svg element, and stops bubbling at the svg boundary.
            this.dispatchEvent(new MouseEvent(ev.type, ev));
          },
        },
        marginTop: 0,
        marginRight: 0,
        marginBottom: null,
        marginLeft: null,
        renderTo: this.el,
        spacingBottom: 30,
        spacingLeft: 28,
        style: {
          fontFamily: `"Helvetica Neue", helvetica, sans-serif`,
          fontSize: `12px`,
        },
        type: `line`,
        zoomType: `x`,
      },

      credits: {
        enabled: false,
      },
      legend: {
        enabled: false,
      },
      loading: {
        labelStyle: {
          color: `transparent`,
        },
      },
      global: {
        useUTC: false,
      },
      plotOptions: {
        line: {
          incompleteStyle: {
            'stroke-dasharray': `3,5`,
          },
          lineWidth: 2,
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: true,
              },
            },
            lineColor: `#fff`,
            lineWidth: 0,
            radius: 3,
            symbol: `circle`,
          },
          shadow: false,
          states: {
            hover: {
              lineWidth: 3,
              lineWidthPlus: 0,
            },
          },
          turboThreshold: 0,
        },
        series: {
          animation: {
            duration: 300,
          },
          events: {
            mouseOver() {
              // TODO(mack): this.group.toFront() doesn't seem to do anything. Is this necessary?
              this.group.toFront();
              // Move the markers (dots) in front of the time series.
              this.markerGroup.toFront();
            },
          },
          fillOpacity: 1,
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: true,
              },
            },
            lineWidth: 1, // TODO: bring marker above line. issue from toFront()
            symbol: `circle`,
          },
          shadow: false,
          stacking: null,
        },
      },

      title: {
        text: null,
      },

      tooltip: {
        backgroundColor: `#fff`,
        borderWidth: 0,
        formatter: this.tooltipFormatter(),
        shadow: false,
        useHTML: true,
      },

      xAxis: util.extend(axisOptions, {
        crosshair: true,
        labels: {
          formatter: this.xAxisFormatter(),
          style: {
            color: `#868ea3`,
          },
          y: 18,
        },
        maxPadding: 0.01,
        minPadding: 0.01,
        minTickInterval: util.MS_BY_UNIT[this._displayOptions.timeUnit],
        showFirstLabel: false,
        showLastLabel: false,
        startOnTick: false,
        tickmarkPlacement: `on`,
        tickPosition: `outside`,
        type: `datetime`,
      }),
      yAxis: util.extend(axisOptions, {
        allowDecimals: true,
        gridLineColor: `#e6e8eb`,
        gridLineDashStyle: `shortDash`,
        labels: {
          formatter: this.yAxisFormatter(),
          style: {
            fontWeight: `bold`,
            color: `#868ea3`,
          },
          x: -20,
        },
        min: 0,
        maxPadding: 0.1,
        minPadding: 0,
        title: {
          text: null,
        },
        showFirstLabel: false,
        showLastLabel: false,
      }),
    };
  }

  renderChart() {
    if (!this.chartData || !this.initialized || !this._displayOptions || !this._changeId) {
      return;
    }

    const displayOptions = this._displayOptions || {};
    const highchartsOptions = this.defaultHighchartsOptions();

    if (displayOptions.plotStyle === `stacked`) {
      highchartsOptions.plotOptions.series.stacking = `normal`;
      highchartsOptions.plotOptions.series.fillOpacity = 0.2;
      highchartsOptions.chart.type = `area`;
      if (displayOptions.value === `relative`) {
        highchartsOptions.plotOptions.series.stacking = `percent`;
      }
    }
    if (displayOptions.analysis === `logarithmic`) {
      highchartsOptions.yAxis.type = `logarithmic`;
      highchartsOptions.yAxis.min = LOGARITHMIC_CHART_ZERO_REMAPPING;
    }

    highchartsOptions.plotOptions.series.marker.enabled = Object.keys(this.chartData).every(seriesName => (
      Object.keys(this.chartData[seriesName]).length <= 1
    ));

    let chartSeries = dataObjectToSortedSeries(this.chartData);
    chartSeries = chartSeries
      .map(series => Object.assign(series, {
        color: this.colorForSeries(series.name),
        isIncompletePath: util.isIncompleteInterval(series.data, {
          unit: this._displayOptions.timeUnit,
          utcOffset: this.utcOffset,
        }),
        type: highchartsOptions.chart.type,
        visible: this.isSeriesShowing(series.name),
        headerPath: this.chartDataPaths[series.name],
      }))
      .sort(multiPartSortComparator(this._headers, {transform: series => series.headerPath}))
      .map((series, index) => Object.assign(series, {index})); // add sorted index


    const [showingSeries, hiddenSeries] = partition(chartSeries, s => s.visible);

    this.updateChartSeriesWithAnomalies(showingSeries);

    highchartsOptions.series = showingSeries;
    this.showingSeriesNames = new Set(showingSeries.map(series => series.name));

    this.hiddenSeries = hiddenSeries.reduce((obj, series) => Object.assign(obj, {[series.name]: series}), {});
    this.highchart = new Highcharts.Chart(highchartsOptions);
  }

  isSeriesShowing(seriesName) {
    return (this._segFilters &&
      this._segFilters.hasOwnProperty(seriesName) &&
      this._segFilters[seriesName]);
  }

  updateChartSeriesWithAnomalies(chartSeries) {
    const component = this;

    const anomalyAlerts = this._anomalyAlerts || [];
    anomalyAlerts.forEach(anomalyAlert => {
      const anomaly = anomalyAlert.anomaly;

      // Find the time series corresponding to this anomaly
      const series = chartSeries.find(series => {
        if (!this._hasSingleSeriesTopLevel) {
          // We do not currently support showing anomalies if there are multiple show clauses
          return false;
        }
        return isEqual(anomaly.insightsDetails.propertyVals, series.headerPath);
      });

      // Find the data point in the time series corresponding to the anomaly
      const matchingDataPointIndex = series.data.findIndex(dataPoint => {
        return anomaly.anomalyTimestamp === dataPoint[0];
      });
      if (matchingDataPointIndex === -1) {
        return;
      }

      // Replace the data point with the anomaly
      const anomalyIcon = anomaly.direction === `NEGATIVE` ? anomalyDownIcon : anomalyUpIcon;
      const dataPoint = series.data[matchingDataPointIndex];
      series.data[matchingDataPointIndex] = {
        cursor: `pointer`,
        marker: {
          enabled: true,
          symbol: `url(${anomalyIcon})`,
        },
        x: dataPoint[0],
        y: dataPoint[1],
        events: {
          click(ev) {
            component.dispatchEvent(new CustomEvent(`clickedAnomaly`, {
              detail: {
                offsetEl: ev.target,
                anomalyAlert,
              },
            }));
          },
          mouseOver() {
            this.graphic.element.style.cursor = `pointer`;
          },
        },
      };
    });
  }

  updateShowHideSeries() {
    if (!this.initialized || !this.highchart || !this._segFilters || !this.showingSeriesNames) {
      return;
    }

    Object.keys(this._segFilters).forEach(seriesName => {
      if (!this.showingSeriesNames.has(seriesName) && this.isSeriesShowing(seriesName)) {
        // this series does NOT exists in the Chart. Add it to the chart series as visible
        const series = util.extend(this.hiddenSeries[seriesName], {visible: true});
        this.highchart.addSeries(util.extend(series, {index: series.index}), false, false);
        this.showingSeriesNames.add(seriesName);
      }
    });

    this.highchart.series.forEach(series =>
      series.setVisible(this.isSeriesShowing(series.name), false)
    );

    this.highchart.redraw();
  }

  updateChartInteractions() {
    if (!this.highchart) {
      return;
    }

    // Before HighCharts 5.0, there's no way to dynamically update options. Create new HighCharts with
    // modified options based on answer here: https://stackoverflow.com/a/18402973.
    if (this._disableChartInteractions) {
      const options = this.highchart.options;
      options.plotOptions.line.marker.states.hover.enabled = false;
      options.plotOptions.series.marker.states.hover.enabled = false;
      options.plotOptions.series.animation = false;
      options.tooltip = {enabled: false};
      options.xAxis[0].crosshair = false;
      this.highchart = new Highcharts.Chart(options);
    } else {
      const options = this.highchart.options;
      const defaultOptions = this.defaultHighchartsOptions();
      options.plotOptions.line.marker.states.hover.enabled = defaultOptions.plotOptions.line.marker.states.hover.enabled;
      options.plotOptions.series.marker.states.hover.enabled = defaultOptions.plotOptions.series.marker.states.hover.enabled;
      options.tooltip = defaultOptions.tooltip;
      options.xAxis[0].crosshair = defaultOptions.xAxis.crosshair;
      this.highchart = new Highcharts.Chart(options);
      // Wait until the highcharts is re-rendered before re-enabling animations. Otherwise, it will
      // animate the re-render.
      this.highchart.options.plotOptions.series.animation = defaultOptions.plotOptions.series.animation;
    }
  }

  get chartData() {
    return this._chartData;
  }

  colorForSeries(seriesName) {
    const colorIdx = this._segmentColorMap[seriesName] || 1;
    return commonCSS[`segmentColor${colorIdx}`];
  }

  renderChartIfChange() {
    const changeId = generateChangeId({
      dataId: this._dataId,
      displayOptions: this._displayOptions,
      headers: this._headers,
      segmentColorMap: this._segmentColorMap,
      utcOffset: this.utcOffset,
    });
    if (changeId && this._changeId !== changeId) {
      this._changeId = changeId;
      this.renderChart();
    }
  }

  set chartData(chartData) {
    this._anomalyAlerts = chartData.anomalyAlerts;
    this._dataId = chartData.dataId;
    this._displayOptions = chartData.displayOptions || {};
    this._chartData = chartData.data.values;
    this.chartDataPaths = chartData.data.paths;
    this._headers = chartData.headers;
    this._segmentColorMap = chartData.segmentColorMap;
    this._hasSingleSeriesTopLevel = chartData.hasSingleSeriesTopLevel;

    if (this._hasSingleSeriesTopLevel) {
      for (const [key, value] of Object.entries(this.chartDataPaths)) {
        this.chartDataPaths[key] = value.slice(1);
      }
    }

    this.renderChartIfChange();
  }

  get utcOffset() {
    return this._utcOffset;
  }

  set utcOffset(timezoneOffset) {
    this._utcOffset = timezoneOffset;
    this.renderChartIfChange();
  }
}

document.registerElement(`mp-line-chart`, MPLineChart);

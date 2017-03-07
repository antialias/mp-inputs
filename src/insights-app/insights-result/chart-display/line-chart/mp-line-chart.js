/* global Highcharts */
import partition from 'lodash/partition';
import WebComponent from 'webcomponent';

import * as util from '../../../../util';

import {
  dataObjectToSortedSeries,
  generateChangeId,
  killLastGridline,
} from './line-chart-util';

import commonCSS from '!!style!css?camelCase!stylus!../../../../stylesheets/common.styl';

const LOGARITHMIC_CHART_ZERO_REMAPPING = 0.6;

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
      this.updateShowHideSegments();
    }
  }

  convertDateForOffset(timestamp) {
    return Number(timestamp) - (-(new Date).getTimezoneOffset() * 60 * 1000);
  }

  timestampToTimeUnitFunction({displayRangeIfWeek=true}={}) {
    const unit = this._displayOptions.timeUnit;
    const customFormatting = {'day': `MMM D`};
    return timestamp => {
      // Highcharts is too old to let us set a timezone so we need to add the offset to the date.
      timestamp = this.convertDateForOffset(timestamp);
      return util.formatDate(timestamp, {unit, displayRangeIfWeek, customFormatting});
    };
  }

  getTickPositions() {
     // TODO (Jordan): Pass in buckets from query. Handle short date ranges.
    if ([`week`, `quarter`].includes(this._displayOptions.timeUnit)) {
      const uniqueDates = new Set();
      Object.keys(this.chartData).forEach(segment => {
        Object.keys(this.chartData[segment]).forEach(date => uniqueDates.add(this.convertDateForOffset(date)));
      });
      let ticks = [...uniqueDates].sort();
      const MAX_TICKS = 20;
      if (ticks.length > MAX_TICKS) {
        const tickDivisor = 1 + Math.floor(ticks.length / MAX_TICKS); // preserve 1 of every n ticks
        ticks = ticks.filter((_, idx) => !(idx % tickDivisor));
      }
      return ticks;
    }
    return null; // giving null in highcharts means "use default"
  }

  tooltipFormatter() {
    const timeFormatter = this.timestampToTimeUnitFunction();
    const unit = this._displayOptions.timeUnit;

    const formatSeriesName = segments => {
      return segments.map((segment, idx) => {
        return util.renamePropertyValue(segment, this._headers[idx]);
      }).join(` / `);
    };

    return function() {
      const seriesName = formatSeriesName(this.point.series.options.headerPath);
      const isIncomplete = util.isIncompleteInterval([this], {unit});
      const index = this.series.data.indexOf(this.point);
      let delta = null;
      // TODO: revisit design for stacked chart, which already shows proportional percentage
      if (index > 0 && !this.percentage) {
        const last = this.series.data[index - 1];
        delta = last.y > 0 ? (this.y - last.y) / last.y : null;
      }
      return `
        <div class="title" style="background-color: ${this.series.color};">${util.truncateMiddle(seriesName, 45)}</div>
        <div class="results">
          <div class="absolute">
            <span class="date">${timeFormatter(this.key)}: </span>
            <span class="count">${util.commaizeNumber(this.y)}</span>
          </div>
          ${this.percentage ? `<div class="percent">${util.formatPercent(this.percentage * .01)}</div>` : ``}
          ${delta !== null ? `<div class="delta ${delta < 0 ? `delta-neg` : (delta > 0 ? `delta-pos` : ``)}">${delta > 0 ? `+` : ``}${util.formatPercent(delta)}</div>` : ``}
        </div>
        ${isIncomplete ? `<div class="footer">Incomplete ${unit}</div>` : ``}
      `;
    };
  }

  xAxisFormatter() {
    var timeFormatter = this.timestampToTimeUnitFunction({displayRangeIfWeek: false});
    return function() {
      return timeFormatter(this.value);
    };
  }

  yAxisFormatter() {
    return function() {
      return this.value < 10000 ? util.commaizeNumber(this.value) : util.abbreviateNumber(this.value);
    };
  }

  renderChart() {
    if (!this.chartData || !this.initialized || !this._displayOptions || !this._changeId) {
      return;
    }

    const displayOptions = this._displayOptions || {};
    const axisOptions = {
      endOnTick: true,
      lineWidth: 1,
      lineColor: commonCSS.grey150,
      minPadding: 0,
      maxPadding: 0,
      startOnTick: true,
    };
    const highchartsOptions = {

      chart: {
        backgroundColor: `rgba(255,255,255,0)`,
        borderRadius: 0,
        events: {
          redraw: killLastGridline,
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
          lineWidth: 3,
          marker: {
            hover: {
              enabled: true,
            },
            lineColor: `#fff`,
            lineWidth: 2,
            radius: 5,
            symbol: `circle`,
          },
          shadow: false,
          states: {
            hover: {
              lineWidth: 4,
              lineWidthPlus: 0,
            },
          },
          turboThreshold: 0,
        },
        series: {
          animation: {
            duration: 300,
          },
          cursor: `pointer`,
          fillOpacity: 1,
          marker: {
            enabled: null,
            hover: {
              enabled: true,
            },
            lineWidth: 2,
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
        endOnTick: false,
        labels: {
          formatter: this.xAxisFormatter(),
          style: {
            color: `#868ea3`,
          },
          y: 18,
        },
        maxPadding: 0.017,
        minPadding: 0.017,
        minTickInterval: util.MS_BY_UNIT[this._displayOptions.timeUnit],
        startOnTick: false,
        tickmarkPlacement: `on`,
        tickPosition: `outside`,
        tickPositions: this.getTickPositions(),
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
        minPadding: 0,
        title: {
          text: null,
        },
        showFirstLabel: false,
        showLastLabel: false,
      }),
    };

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

    highchartsOptions.plotOptions.series.marker.enabled = Object.keys(this.chartData).every(segmentName => (
      Object.keys(this.chartData[segmentName]).length <= 1
    ));

    let chartSeries = dataObjectToSortedSeries(this.chartData);
    chartSeries = chartSeries.map(series => Object.assign(series, {
      color: this.colorForSegment(series.name),
      isIncompletePath: util.isIncompleteInterval(series.data, {
        unit: this._displayOptions.timeUnit,
        utcOffset: this.utcOffset,
      }),
      type: highchartsOptions.chart.type,
      visible: this.isSegmentShowing(series.name),
      headerPath: this.chartDataPaths[series.name],
    }));

    const [showingSeries, hiddenSeries] = partition(chartSeries, s => s.visible);

    // Rendering is EXPENSIVE. Start the Chart with only visible segments. updateShowHideSegments adds segments to the Chart as needed.
    highchartsOptions.series = showingSeries;

    // highchartSegmentIdxMap is the living map of segments rendered to the Chart.
    this.highchartSegmentIdxMap = highchartsOptions.series.reduce((obj, seg, idx) =>
      Object.assign(obj, {[seg.name]: idx})
    , {});

    this.hiddenSeries = hiddenSeries.reduce((obj, series) => Object.assign(obj, {[series.name]: series}), {});
    this.highchart = new Highcharts.Chart(highchartsOptions);

  }

  isSegmentShowing(segmentName) {
    return (this._segFilters &&
      this._segFilters.hasOwnProperty(segmentName) &&
      this._segFilters[segmentName]);
  }

  updateShowHideSegments() {
    if (!this.initialized || !this.highchart || !this._segFilters || !this.highchartSegmentIdxMap) {
      return;
    }

    Object.keys(this._segFilters).forEach(segmentName => {
      const isVisible = this.isSegmentShowing(segmentName);
      const visibleSegIdx = this.highchartSegmentIdxMap[segmentName];
      if (Number.isInteger(visibleSegIdx)) {
        // this segment already exists in the Chart. Make it visible
        if (this.highchart.series[visibleSegIdx]) {
          this.highchart.series[visibleSegIdx].setVisible(isVisible, false);
        }
      } else if (isVisible) {
        // this segment does NOT exists in the Chart. Add it to the series as visible and update highchartSegmentIdxMap.
        const hiddenSegment = util.extend(this.hiddenSeries[segmentName], {visible: true});
        this.highchart.addSeries(hiddenSegment, false, false);
        this.highchartSegmentIdxMap[segmentName] = this.highchart.series.length - 1;
      }
    });
    this.highchart.redraw();

  }

  get chartData() {
    return this._chartData;
  }

  colorForSegment(segmentName) {
    const colorIdx = this._segmentColorMap[segmentName] || 1;
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
    this._dataId = chartData.dataId;
    this._displayOptions = chartData.displayOptions || {};
    this._chartData = chartData.data.values;
    this.chartDataPaths = chartData.data.paths;
    this._headers = chartData.headers;
    this._segmentColorMap = chartData.segmentColorMap;
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
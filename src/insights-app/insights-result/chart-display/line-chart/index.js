/* global $, Highcharts */
import moment from 'moment';
import { Component } from 'panel';
import WebComponent from 'webcomponent';

import * as util from '../../../../util';
import {
  nestedObjectPaths,
} from '../../chart-util';

import commonCSS from '!!style!css?camelCase!stylus!../../../../stylesheets/common.styl';
import template from './index.jade';
import './index.styl';

const LOGARITHMIC_CHART_ZERO_REMAPPING = 0.6;

/**
 * https://github.com/mixpanel/mixpanel-platform/blob/d171a3ec/js/ui/chart.js#L38-L54
 * this function is a hack because highcharts insists on showing a
 * gridline for the 0th label on the y-axis, which conflicts with
 * the x-axis
 */
function killLastGridline() {
  const gridlines = $(`.highcharts-grid path`, this.container).show()
    .map(function(gridline) {
      const $gridline = $(gridline);
      const offset = $gridline.offset();
      return [$gridline, (offset && offset.top) || 0];
    })
    .sort((a, b) => a[1] - b[1]);
  const line = gridlines[gridlines.length - 1];
  if (line && line[0] && line[0].hide) {
    line[0].hide();
  }
}

document.registerElement(`line-chart`, class extends Component {
  get config() {
    return {
      template,
      defaultState: {
        chartLabel: null,
        data: {},
        util,
      },
    };
  }

  attachedCallback() {
    super.attachedCallback(...arguments);
    // TODO: research why attributeChangedCallback is not called before component
    // is attached only in full webcomponents polyfill (and not lite version)
    this.updateChartState();
  }

  attributeChangedCallback(attrName, _, newVal) {
    if (attrName === `seg-filters`) {
      this.update({segFilters: JSON.parse(newVal)});
    } else {
      this.updateChartState();
    }
  }

  updateChartState() {
    if (!this.chartData || !this.initialized) {
      return;
    }

    let {headers, series, dataId} = this.chartData;

    if (headers && series) {
      const newState = {
        chartLabel: JSON.parse(this.getAttribute(`chart-label`)),
        dataId,
        displayOptions: JSON.parse(this.getAttribute(`display-options`)),
        segmentColorMap: this.getJSONAttribute(`segment-color-map`),
        utcOffset: this.utcOffset,
      };

      if (this.state.dataId !== dataId) {
        // transform nested object into single-level object:
        // {'a': {'b': {'c': 5}}} => {'a / b / c': 5}
        newState.data = util.objectFromPairs(nestedObjectPaths(series, 1).map(path =>
            [this.formatHeader(path.slice(0, -1), headers), path.slice(-1)[0]]
        ));
      }
      this.update(newState);
    }
  }

  formatHeader(parts, headers) {
    if (headers[0] === `$events`) {
      parts = [util.renameEvent(parts[0]), ...parts.slice(0, -1).map(util.renamePropertyValue)];
    } else {
      parts = parts.map(util.renamePropertyValue);
    }
    return parts.join(` / `);
  }

  get chartData() {
    return this._chartData;
  }

  set chartData(data) {
    this._chartData = data;
    this.updateChartState();
  }
});

document.registerElement(`mp-line-chart`, class extends WebComponent {
  attachedCallback() {
    this.initialized = true;
    this.el = document.createElement(`div`);
    this.el.className = `mp-highcharts-container`;
    this.appendChild(this.el);
  }

  attributeChangedCallback(attrName, _, newVal) {
    if (attrName === `seg-filters`) {
      this._segFilters = this._segFilters || {};
      this._segFilters = JSON.parse(newVal);
      this.updateShowHideSegments();
    }
  }

  timestampToTimeUnitFunction({displayRangeIfWeek=true}={}) {
    const unit = this._displayOptions.timeUnit;
    const customFormatting = {'day': `MMM D`};
    return timestamp => util.formatDate(timestamp, {unit, displayRangeIfWeek, customFormatting, utc: true});
  }

  getTickPositions() {
     // TODO (Jordan): Pass in buckets from query. Handle short date ranges.
    if ([`week`, `quarter`].includes(this._displayOptions.timeUnit)) {
      const uniqueDates = new Set();
      Object.keys(this.chartData).forEach(segment => {
        Object.keys(this.chartData[segment]).forEach(date => uniqueDates.add(moment.utc(date).unix() * 1000));
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

    return function() {
      const isIncomplete = util.isIncompleteInterval([this], {unit});
      const index = this.series.data.indexOf(this.point);
      let delta = null;
      // TODO: revisit design for stacked chart, which already shows proportional percentage
      if (index > 0 && !this.percentage) {
        const last = this.series.data[index - 1];
        delta = last.y > 0 ? (this.y - last.y) / last.y : null;
      }
      return `
        <div class="title" style="background-color: ${this.series.color};">${util.truncateMiddle(this.series.name, 45)}</div>
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

      colors: [
        commonCSS.segmentColor1,
        commonCSS.segmentColor2,
        commonCSS.segmentColor3,
        commonCSS.segmentColor4,
        commonCSS.segmentColor5,
        commonCSS.segmentColor6,
        commonCSS.segmentColor7,
        commonCSS.segmentColor8,
      ],

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
        dateTimeLabelFormats: {
          day: `%b %e`,
        },
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

    const dataKeys = Object.keys(this.chartData);

    highchartsOptions.plotOptions.series.marker.enabled = dataKeys.every(segmentName => (
      Object.keys(this.chartData[segmentName]).length <= 1
    ));

    // Highcharts is to old to let us force a timezone
    const offsetDate = timestamp => Number(timestamp) - (this.utcOffset * 60 * 1000);

    const { showingSeries, hiddenSeries } = dataKeys.reduce((series, segmentName) => {
      const counts = this.chartData[segmentName];
      const data = util.sorted(Object.keys(counts), {transform: Number})
        .map(timestamp => [offsetDate(timestamp), counts[timestamp]]);
      const segment = {
        color: highchartsOptions.colors[this.colorIdxForSegment(segmentName)],
        data,
        isIncompletePath: util.isIncompleteInterval(data, {unit: this._displayOptions.timeUnit}),
        name: segmentName,
        type: highchartsOptions.chart.type,
        visible: this.isSegmentShowing(segmentName),
      };

      if (segment.visible) {
        series.showingSeries.push(segment);
      } else {
        series.hiddenSeries.push(segment);
      }
      return series;
    }, {showingSeries: [], hiddenSeries: []});

    // Rendering is EXPENSIVE. Start the Chart with only visible segments. updateShowHideSegments adds segments to the Chart as needed.
    highchartsOptions.series = showingSeries;

    // highchartSegmentIdxMap is the living map of segments rendered to the Chart.
    this.highchartSegmentIdxMap = highchartsOptions.series.reduce((obj, seg, idx) => Object.assign(obj, {[seg.name]: idx}), {});

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

  colorIdxForSegment(segmentName) {
    return (this._segmentColorMap[segmentName] || 1) - 1;
  }

  renderChartIfChange() {
    const {analysis, plotStyle, value, timeUnit} = this._displayOptions;
    const changeAttrs = [
      this._dataId,
      this.utcOffset,
      analysis,
      plotStyle,
      value,
      timeUnit,
      Boolean(this._segmentColorMap),
    ];

    const changeId = changeAttrs.every(Boolean) ? changeAttrs.join(`-`) : null;

    if (changeId && this._changeId !== changeId) {
      this._changeId = changeId;
      this.renderChart();
    }
  }

  set chartData(chartData) {
    this._dataId = chartData.dataId;
    this._displayOptions = chartData.displayOptions || {};
    this._chartData = chartData.data;
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
});

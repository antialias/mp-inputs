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

  attributeChangedCallback() {
    this.updateChartState();
  }

  updateChartState() {
    if (!this.chartData || !this.initialized) {
      return;
    }

    let {headers, series, peopleTimeSeries} = this.chartData;
    const chartLabel = JSON.parse(this.getAttribute(`chart-label`));

    const data = peopleTimeSeries || series;

    if (headers && data) {
      this.update({
        // transform nested object into single-level object:
        // {'a': {'b': {'c': 5}}} => {'a / b / c': 5}
        chartLabel,
        data: util.objectFromPairs(nestedObjectPaths(data, 1).map(path =>
          [this.formatHeader(path.slice(0, -1), headers), path.slice(-1)[0]]
        )),
        displayOptions: JSON.parse(this.getAttribute(`display-options`)),
        utcOffset: this.utcOffset,
      });
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
    this.renderChart();
  }

  attributeChangedCallback() {
    this._displayOptions = JSON.parse(this.getAttribute(`display-options`) || `{}`);
    this.renderChart();
  }

  timestampToTimeUnitFunction({displayRangeIfWeek=true}={}) {
    const unit = this._displayOptions.timeUnit;
    const customFormatting = {'day': `MMM D`};
    return timestamp => util.formatDate(timestamp, {unit, displayRangeIfWeek, customFormatting});
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
    const utcOffset = this.utcOffset;

    return function() {
      const isIncomplete = util.isIncompleteInterval([this], {unit, utcOffset});
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

  createChartOptions() {
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

    // create the series data!
    //
    // a whole pile of garbage courtesy of
    // https://github.com/mixpanel/mixpanel-platform/blob/d171a3e/js/ui/chart.js#L449-L580

    // I presume we can replace this with one of our existing Insights/mp-common utils
    const _flat = function(obj, depth) {
      if (typeof obj !== `object`) {
        return obj;
      } else {
        if (depth <= 0) {
          return Object.values(obj).reduce((sum, v) => sum + _flat(v, depth), 0);
        } else {
          depth--;
          const ag = {};
          for (let key of Object.keys(obj)) {
            ag[key] = _flat(obj[key], depth);
          }
          return ag;
        }
      }
    };

    const data = _flat(this.chartData, 2);

    const seriesMap = {};
    let allLabelsAreDates = true;
    for (let segmentName of Object.keys(data)) {
      const counts = data[segmentName];
      if (Object.keys(counts).length === 1) {
        highchartsOptions.plotOptions.series.marker.enabled = true;
      }

      let type = `line`;
      if (highchartsOptions && highchartsOptions.chart && highchartsOptions.chart.type === `area`) {
        type = `area`;
      }
      const series = {
        name: segmentName,
        type,
        data: Object.keys(counts).map(label => {
          const count = counts[label];
          // Todo Jordan: remove when implementing new line chart logic
          let labelAsDate = moment(label.split(`Z`)[0]);
          if (labelAsDate.isValid()) {
            label = labelAsDate.valueOf();
          } else {
            allLabelsAreDates = false;
          }
          return [label, count];
        }),
      };
      seriesMap[segmentName] = series;
    }

    if (allLabelsAreDates) {
      highchartsOptions.xAxis.type = `datetime`;
      for (let series of Object.values(seriesMap)) {
        series.data = util.sorted(series.data, {transform: d => d[0]}); // sort by date
      }
    } else {
      highchartsOptions.xAxis.type = `category`;
    }

    const sortedSegments = Object.keys(data)
      .map(segment => {
        // vals is a dictionary of timestamps to counts
        const vals = data[segment];
        const segmentTotal = Object.values(vals).reduce((sum, val) => sum + val, 0);
        return [segment, segmentTotal];
      })
      .sort((a, b) => b[1] - a[1])
      .map(pair => pair[0]);

    highchartsOptions.series = sortedSegments.map((s, idx) => util.extend(seriesMap[s], {
      color: highchartsOptions.colors[idx % highchartsOptions.colors.length],
      isIncompletePath: util.isIncompleteInterval(seriesMap[s].data, {
        unit: this._displayOptions.timeUnit,
        utcOffset: this.utcOffset,
      }),
    }));

    return highchartsOptions;
  }

  renderChart() {
    if (!this.chartData || !this.initialized || !this._displayOptions) {
      return;
    }

    if (this.el) {
      this.removeChild(this.el);
    }

    this.el = document.createElement(`div`);
    this.el.className = `mp-highcharts-container`;
    this.appendChild(this.el);

    this.highchart = new Highcharts.Chart(this.createChartOptions());
  }

  get chartData() {
    return this._chartData;
  }

  set chartData(data) {
    this._chartData = data;
    this.renderChart();
  }

  get utcOffset() {
    return this._utcOffset;
  }

  set utcOffset(offset) {
    this._utcOffset = offset;
    this.renderChart();
  }
});

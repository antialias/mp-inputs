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
    this.updateStateFromAttributes();
  }

  attributeChangedCallback() {
    this.updateStateFromAttributes();
  }

  updateStateFromAttributes() {
    let { headers, series } = JSON.parse(this.getAttribute(`data`)) || {};
    const chartLabel = JSON.parse(this.getAttribute(`chart-label`));

    if (headers && series) {
      this.update({
        // transform nested object into single-level object:
        // {'a': {'b': {'c': 5}}} => {'a / b / c': 5}
        chartLabel,
        data: util.objectFromPairs(nestedObjectPaths(series, 1).map(path =>
          [this.formatHeader(path.slice(0, -1), headers), path.slice(-1)[0]]
        )),
        displayOptions: JSON.parse(this.getAttribute(`display-options`)),
      });
    }
  }

  formatHeader(parts, headers) {
    if (headers[0] === `$events`) {
      parts = [util.renameEvent(parts[0]), ...parts.slice(0, -1).map(util.renameProperty)];
    } else {
      parts = parts.map(util.renameProperty);
    }
    return parts.join(` / `);
  }
});

document.registerElement(`mp-line-chart`, class extends WebComponent {
  attachedCallback() {
    this.renderMPChart();
  }

  attributeChangedCallback() {
    this._data = JSON.parse(this.getAttribute(`data`) || `{}`);
    this._displayOptions = JSON.parse(this.getAttribute(`display-options`) || `{}`);

    this.renderMPChart();
  }

  epochToTimeUnitFunction(options={}) {
    const timeFormatting = {
      'hour': `MMM D[,] ha`,
      'day': `MMM D`,
      'week': `MMM D`,
      'month': `MMM YYYY`,
      'quarter': `[Q]Q YYYY`,
      'year': `YYYY`,
    };
    const timeUnit = this._displayOptions.timeUnit;
    const timeFormatter = timeFormatting[timeUnit];
    return epoch => {
      const epochMoment = moment.utc(Number(epoch));
      if (timeUnit === `week` && options.displayRangeIfWeek) {
        return `${epochMoment.format(timeFormatter)} - ${epochMoment.add(6, `days`).format(timeFormatter)}`;
      } else {
        return epochMoment.format(timeFormatter);
      }
    };
  }

  getTickPositions() {
     // TODO (Jordan): Pass in buckets from query. Handle short date ranges.
    if ([`week`, `quarter`].includes(this._displayOptions.timeUnit)) {
      const uniqueDates = new Set();
      Object.keys(this._data).forEach(segment => {
        Object.keys(this._data[segment]).forEach(date => uniqueDates.add(moment.utc(date).unix() * 1000));
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
    var timeFormatter = this.epochToTimeUnitFunction({displayRangeIfWeek: true});
    return function() {
      return `
        <div class="title" style="background-color: ${this.series.color};">${this.series.name}</div>
        <div class="results">
          <div class="absolute">
            <span class="date">${timeFormatter(this.key)}: </span>
            <span class="count">${this.y}</span>
          </div>
          ${this.percentage ? `<div class="percent">${util.formatPercent(this.percentage * .01)}</div>` : ``}
        </div>
      `;
    };
  }

  xAxisFormatter() {
    var timeFormatter = this.epochToTimeUnitFunction();
    return function() {
      return timeFormatter(this.value);
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
        marginTop: 0,
        marginRight: 0,
        marginBottom: null,
        marginLeft: null,
        renderTo: this.$el[0],
        spacingBottom: 30,
        spacingLeft: 28,
        type: `line`,
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

      plotOptions: {
        line: {
          lineWidth: 3,
          marker: {
            hover: {
              enabled: true,
            },
          },
          states: {
            hover: {
              lineWidth: 4,
              lineWidthPlus: 0,
            },
          },
        },
        series: {
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

      tooltip: {
        borderWidth: 0,
        formatter: this.tooltipFormatter(),
      },

      xAxis: util.extend(axisOptions, {
        endOnTick: false,
        labels: {
          formatter: this.xAxisFormatter(),
        },
        minTickInterval: util.MS_BY_UNIT[this._displayOptions.timeUnit],
        startOnTick: false,
        tickPositions: this.getTickPositions(),
      }),
      yAxis: util.extend(axisOptions, {
        showFirstLabel: true,
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

    // I presume we can replace this with one of our existing IRB/mp-common utils
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

    const data = _flat(this._data, 2);

    const seriesMap = {};
    let allLabelsAreDates = true;
    for (let segmentName of Object.keys(data)) {
      const counts = data[segmentName];

      let type = `line`;
      if (highchartsOptions && highchartsOptions.chart && highchartsOptions.chart.type === `area`) {
        type = `area`;
      }
      const series = {
        name: segmentName,
        type,
        data: Object.keys(counts).map(label => {
          const count = counts[label];
          const labelAsDate = moment(label);
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
    }));

    return highchartsOptions;
  }

  renderMPChart() {
    if (this.$el) {
      this.$el.remove();
    }
    this.$el = $(`<div>`).appendTo(this);
    this.highchart = new Highcharts.Chart(this.createChartOptions());
  }
});

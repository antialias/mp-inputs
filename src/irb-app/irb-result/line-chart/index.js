/* global $ */

import moment from 'moment';
import { Component } from 'panel';
import WebComponent from 'webcomponent';

import * as util from '../../../util';
import {
  nestedObjectPaths,
} from '../chart-util';

import commonCSS from '!!style!css?camelCase!stylus!../../../stylesheets/common.styl';
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

  attributeChangedCallback() {
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
        startOnTick: false,
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
    return {
      chartType: `line`,
      highchartsOptions,
      lineLimit: false,
      MPstyling: false,
    };
  }

  renderMPChart() {
    if (this.$el) {
      this.$el.remove();
    }

    this.$el = $(`<div>`).appendTo(this);
    this.$el
      .MPChart(this.createChartOptions())
      .MPChart(`setData`, this._data);
  }
});

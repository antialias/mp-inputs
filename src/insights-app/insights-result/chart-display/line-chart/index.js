import { Component } from 'panel';

import * as util from '../../../../util';

import template from './index.jade';
import './index.styl';
import './mp-line-chart.js';

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

  attributeChangedCallback(attrName, oldVal, newVal) {
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

    let {headers, series, hasSingleSeriesTopLevel, dataId} = this.chartData;

    if (headers && series) {
      const newState = {
        chartLabel: this.getJSONAttribute(`chart-label`),
        dataId,
        displayOptions: this.getJSONAttribute(`display-options`),
        headers,
        hasSingleSeriesTopLevel,
        segmentColorMap: this.getJSONAttribute(`segment-color-map`),
        utcOffset: this.utcOffset,
      };

      if (this.state.dataId !== dataId) {
        newState.data = util.flattenNestedObjectToPath(series);
      }
      this.update(newState);
    }
  }

  get chartData() {
    return this._chartData;
  }

  set chartData(data) {
    this._chartData = data;
    this.updateChartState();
  }
});

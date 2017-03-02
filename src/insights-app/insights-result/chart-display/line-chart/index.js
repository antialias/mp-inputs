import { Component } from 'panel';

import * as util from '../../../../util';
import {
  nestedObjectPaths,
} from '../../chart-util';

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

    let {headers, series, dataId} = this.chartData;

    if (headers && series) {
      const newState = {
        chartLabel: this.getJSONAttribute(`chart-label`),
        dataId,
        displayOptions: this.getJSONAttribute(`display-options`),
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


import {Component} from 'panel';

import * as util from '../../../../util';

import template from './index.jade';
import './index.styl';
import './mp-line-chart.js';

document.registerElement(`line-chart`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        handleClickedAnomaly: ev => {
          const anomalyAlert = ev.detail.anomalyAlert;
          if (this.state.focusedAnomaly && this.state.focusedAnomaly.anomalyAlert.alertId === anomalyAlert.alertId) {
            // Clicking the anomaly icon for an open anomaly alert will close the anomaly alert.
            this.removeFocusedAnomaly();
          } else {
            const focusedAnomaly = {anomalyAlert};

            const offsetElRect = ev.detail.offsetEl.getBoundingClientRect();
            focusedAnomaly.offsetLeft = document.body.scrollLeft + offsetElRect.left + offsetElRect.width / 2;
            const anomalyDirection = anomalyAlert.anomaly.direction;
            if (anomalyDirection === `NEGATIVE`) {
              focusedAnomaly.placement = `bottom`;
              focusedAnomaly.offsetTop = document.body.scrollTop + offsetElRect.top + offsetElRect.height;
            } else {
              focusedAnomaly.placement = `top`;
              focusedAnomaly.offsetTop = document.body.scrollTop + offsetElRect.top;
            }
            this.update({focusedAnomaly});
          }
        },
        handleRemovedAnomalyAlert: () => {
          this.removeFocusedAnomaly();
        },
        handleClickAnomalyAlert: ev => {
          // Prevent clicks on the alert from closing the alert.
          ev.stopPropagation();
        },
        handleClickChart: () => {
          if (this.state.focusedAnomaly) {
            this.update({focusedAnomaly: false});
          }
        },
      },
      defaultState: {
        focusedAnomaly: null,
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

    this.removeFocusedAnomaly = () => {
      this.update({focusedAnomaly: null});
    };
    document.addEventListener(`click`, this.removeFocusedAnomaly);
  }

  detachedCallback() {
    document.removeEventListener(`click`, this.removeFocusedAnomaly);
    super.detachedCallback(...arguments);
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

    let {anomalyAlerts, headers, series, dataId} = this.chartData;

    if (headers && series) {
      const newState = {
        anomalyAlerts,
        chartLabel: this.getJSONAttribute(`chart-label`),
        dataId,
        displayOptions: this.getJSONAttribute(`display-options`),
        hasSingleSeriesTopLevel: headers.length > 1 && Object.keys(series).length === 1,
        headers,
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

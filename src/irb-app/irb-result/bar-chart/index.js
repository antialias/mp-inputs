import { Component } from 'panel';

import {
  getTickDistance,
  nestedObjectMax,
  nestedObjectSum,
  nestedObjectToTableRows,
} from '../chart-util';

import './irb-bar-chart-header';

import template from './index.jade';
import './index.styl';

document.registerElement('bar-chart', class extends Component {
  get config() {
    return {
      template,

      helpers: {
        formatChartData: () => {
          const headers = this.state.result.headers;
          const data = nestedObjectSum(this.state.result.data);

          // for each table row, split the data entry (last entry) into
          // two key/value list cells, sorting alphabetically by key
          const rows = nestedObjectToTableRows(data, 1).map(row => {
            const data = row.slice(-1)[0].value;
            const keys = Object.keys(data)
              .sort((a, b) => data[b] - data[a])
              .filter(key => data[key]);
            const values = keys.map(key => data[key]);

            return [...row.slice(0, -1), keys, values];
          });

          const chartMax = nestedObjectMax(data);
          const gridLineDistance = getTickDistance(chartMax);

          return {headers, rows, chartMax, gridLineDistance};
        },
      },
    };
  }
});

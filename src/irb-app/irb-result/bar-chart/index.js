import { Component } from 'panel';

import { containsObjects, countRun, getTickDistance, transpose } from './util';
import * as util from '../../../util';

import './irb-bar-chart-header';

import template from './index.jade';
import './index.styl';

document.registerElement('bar-chart', class extends Component {
  get config() {
    return {
      template,

      helpers: {
        formatChartData: () => {
          let headers = this.state.result.headers;
          let data = JSON.parse(JSON.stringify(this.state.result.data)); // deep copy

          function sumDateResults(obj) {
            if (containsObjects(obj)) {
              Object.keys(obj).forEach(key => {
                let subObj = obj[key];
                let subKeys = Object.keys(subObj);

                if (subKeys.length) {
                  if (util.isDateString(subKeys[0])) {
                    obj[key] = subKeys.reduce((accum, key) => accum + subObj[key], 0);
                  } else {
                    sumDateResults(subObj);
                  }
                }
              });
            }
          }
          sumDateResults(data);

          const chartMax = (function getChartMax(data) {
            if (typeof data === 'number') { return data; }
            return Math.max(0, Math.max(...Object.keys(data).map(key => getChartMax(data[key]))));
          })(data);

          // get rows - lists of keys/data that will fill table
          let rows = [];
          function getRows(data, row=[]) {
            if (containsObjects(data)) {
              Object.keys(data).forEach(key => getRows(data[key], [...row, key]));
            } else {
              const keys = Object.keys(data)
                .sort((a, b) => data[b] - data[a])
                .filter(key => data[key]);

              const values = keys.map(key => data[key]);

              if (keys.length) {
                rows.push([...row, keys, values]);
              }
            }
          }
          getRows(data);

          // Format rows for nested table, calculating necessary rowspans
          // ['a', 'a', 'a', 'b', 'b'] -> [{value: 'a', span: 3}, null, null, {value: 'b': span: 2}, null]
          rows = transpose(transpose(rows).map(row =>
            row.map((cell, i) =>
              i && row[i - 1] === row[i] ? null : {
                span: countRun(row, i),
                value: cell,
              }
            )
          ));

          return {headers, rows, chartMax};
        },

        getTickDistance,

        util,
      },
    };
  }
});

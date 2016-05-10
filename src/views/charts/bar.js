/* global $ */

import WebComponent from 'webcomponent';

import BaseView from '../base';
import {
  abbreviateNumber,
  getTickDistance,
  isDateString,
  renameProperty,
} from '../../util';

import template from '../templates/charts/bar.jade';
import '../stylesheets/charts/bar.styl';

// return true if the given object is itself made up of objects
function containsObjects(obj) {
  let keys = Object.keys(obj);
  return Boolean(keys.length && typeof obj[keys[0]] === 'object');
}

// transpose a 2-dimensional array
// [[1, 2, 3],    [[1, 4],
//  [4, 5, 6]] =>  [2, 5],
//                 [3, 6]]
function transpose(matrix) {
  if (matrix && matrix.length) {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
  }
  return matrix;
}

// given an array of values and a start index,
// count the number of the value at the start index repeats:
// countRun(['a', 'a', 'b', 'b', 'b', 'c'], 2) => 3
function countRun(row, start) {
  let i;
  for (i = start; row[i] === row[start]; i++);
  return i - start;
}

document.registerElement('irb-bar-chart-header', class extends WebComponent {
  createdCallback() {
    this.$el = $('<div>').appendTo(this);
  }

  render() {
    this.$el.empty();

    let headers = (this._headers && this._headers.length) ? this._headers : [''];
    let $headers = $(headers.map(header =>
      $('<div>')
        .addClass('bar-chart-header')
        .append($('<div>').addClass('text').html(renameProperty(header)))
        .get(0)
    ));
    this.$el.append($headers);

    // get an array of tick values, something like [25, 50, 75, 100, ...]
    let tick = 0;
    let ticks = [];
    let tickDistance = getTickDistance(this._chartMax);
    if (this._chartMax) {
      do {
        ticks.push(tick);
        tick += tickDistance;
      } while (tick < this._chartMax);
    }

    let $ticks = $(ticks.map(tick =>
      $('<div>')
        .addClass('bar-chart-tick')
        .width(`${tickDistance / this._chartMax * 100}%`)
        .append($('<div>').addClass('text').html(abbreviateNumber(tick)))
        .get(0)
    ));

    let $axis = $('<div class="bar-chart-axis"></div>').append($ticks);
    this.$el.append($axis);

    setTimeout(() => { // defer so we can inspect the fully-rendered table
      const tableColWidths = this.$el.parents('table')
        .find('tbody tr:first-child td').map((i, el) => $(el).outerWidth()).get();

      // set header widths
      $headers.each((i, el) => {
        $(el).width(tableColWidths[i]);
      });

      // set axis width
      const headerWidths = tableColWidths.slice(0, -1).reduce((sum, width) => sum + width, 0);
      $axis.width(`calc(100% - ${headerWidths}px)`);
    }, 0);
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    this._headers = JSON.parse(headers);
    this.render();
  }

  get chartMax() {
    return this._chartMax;
  }

  set chartMax(chartMax) {
    this._chartMax = JSON.parse(chartMax);
    this.render();
  }
});

export default class BarChartView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  render(state={}) {
    return super.render(this.format(state));
  }

  format(state) {
    let headers = state.result.headers;
    let data = JSON.parse(JSON.stringify(state.result.data)); // deep copy

    function sumDateResults(obj) {
      if (containsObjects(obj)) {
        Object.keys(obj).forEach(key => {
          let subObj = obj[key];
          let subKeys = Object.keys(subObj);

          if (subKeys.length) {
            if (isDateString(subKeys[0])) {
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
  }
}

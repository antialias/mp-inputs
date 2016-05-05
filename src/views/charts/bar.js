import BaseView from '../base';
import {
  extend,
  renameProperty,
  getTextWidth,
  getTickDistance,
} from '../../util';

import template from '../templates/charts/bar.jade';
import '../stylesheets/charts/bar.styl';

function containsObjects(obj) {
  let keys = Object.keys(obj);
  return Boolean(keys.length && typeof obj[keys[0]] === 'object');
}

function transpose(matrix) {
  if (matrix && matrix.length) {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
  }
  return matrix;
}

document.registerElement('irb-bar-chart-header', class extends HTMLElement {
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
    let ticks = [tick];
    let tickDistance = getTickDistance(this._chartMax);
    while (tick < this._chartMax) {
      tick += tickDistance;
      ticks.push(tick);
    }

    let $ticks = $(ticks.map(tick =>
      $('<div>')
        .addClass('bar-chart-tick')
        .width(`${tickDistance / this._chartMax * 100}%`)
        .append($('<div>').addClass('text').html(tick))
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
            if (subKeys[0].match(/\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d/)) {
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

    // get levels - lists of keys at each level of result
    let levels = [];
    let subData = data;
    let keys;
    while (containsObjects(subData)) {
      keys = Object.keys(subData);
      levels.push(keys);
      subData = subData[keys[0]];
    }

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

    rows = transpose(rows);
    rows = rows.map(row =>
      row.map((key, i) => // ['a', 'a', 'a', 'b', 'b'] -> ['a', null, null, 'b', null]
        i && row[i - 1] === row[i] ? null : key
      )
    );
    rows = transpose(rows);

    // TODO this won't currently work for >2 level multiseg, since each segment can have a different set of subsegments underneath it
    // get rowSpans - number of rows each level should span in the table
    let rowSpans = levels.map((level, i) =>
      levels.slice(i + 1).reduce((accum, level) => accum * level.length, 1)
    );

    return {headers, levels, rows, rowSpans, chartMax};
  }
}

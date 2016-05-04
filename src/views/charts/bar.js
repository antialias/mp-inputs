import BaseView from '../base';
import { extend } from '../../util';

import template from '../templates/charts/bar.jade';
import '../stylesheets/charts/bar.styl';

function containsObjects(obj) {
  let keys = Object.keys(obj);
  return Boolean(keys.length && typeof obj[keys[0]] === 'object');
}

function transpose(matrix) {
  return matrix[0].map((col, i) => matrix.map(row => row[i]));
}

export default class BarChartView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  render(state={}) {
    return super.render(this.format(state));
  }

  format(state) {
    let data = JSON.parse(JSON.stringify(state.result)); // deep copy state.result

    //let data = {
    //  Chrome: {
    //    SanFrancisco: {UnitedStates: {Retention: 307, Segmentation: 164, Funnels: 821}, Canada: {Retention: 307, Segmentation: 164, Funnels: 821}},
    //    Chicago: {UnitedStates: {Retention: 174, Segmentation: 920, Funnels: 31}, Canada: {Retention: 174, Segmentation: 920, Funnels: 31}},
    //    Seattle: {UnitedStates: {Retention: 203, Segmentation: 596, Funnels: 855}, Canada: {Retention: 203, Segmentation: 596, Funnels: 855}},
    //    Vancouver: {UnitedStates: {Retention: 542, Segmentation: 467, Funnels: 115}, Canada: {Retention: 542, Segmentation: 467, Funnels: 115}},
    //  },
    //  Firefox: {
    //    SanFrancisco: {UnitedStates: {Retention: 90, Segmentation: 311, Funnels: 860}, Canada: {Retention: 90, Segmentation: 311, Funnels: 860}},
    //    Chicago: {UnitedStates: {Retention: 240, Segmentation: 482, Funnels: 932}, Canada: {Retention: 240, Segmentation: 482, Funnels: 932}},
    //    Seattle: {UnitedStates: {Retention: 948, Segmentation: 181, Funnels: 625}, Canada: {Retention: 948, Segmentation: 181, Funnels: 625}},
    //    Vancouver: {UnitedStates: {Retention: 287, Segmentation: 464, Funnels: 798}, Canada: {Retention: 287, Segmentation: 464, Funnels: 798}},
    //  },
    //  Safari: {
    //    SanFrancisco: {UnitedStates: {Retention: 478, Segmentation: 813, Funnels: 654}, Canada: {Retention: 478, Segmentation: 813, Funnels: 654}},
    //    Chicago: {UnitedStates: {Retention: 975, Segmentation: 64, Funnels: 323}, Canada: {Retention: 975, Segmentation: 64, Funnels: 323}},
    //    Seattle: {UnitedStates: {Retention: 781, Segmentation: 539, Funnels: 735}, Canada: {Retention: 781, Segmentation: 539, Funnels: 735}},
    //    Vancouver: {UnitedStates: {Retention: 970, Segmentation: 411, Funnels: 122}, Canada: {Retention: 970, Segmentation: 411, Funnels: 122}},
    //  }
    //};

    (function sumDateResults(obj) {
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
    })(data);

    const max = (function getDataMax(data) {
      if (typeof data === 'number') { return data; }
      return Math.max(...Object.keys(data).map(key => getDataMax(data[key])));
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
    (function getRows(data, row=[]) {
      if (containsObjects(data)) {
        Object.keys(data).forEach(key => getRows(data[key], [...row, key]));
      } else {
        rows.push([...row, Object.keys(data), Object.values(data)]);
      }
    })(data);

    rows = transpose(rows);
    rows = rows.map(row =>
      row.map((key, i) => // ['a', 'a', 'a', 'b', 'b'] -> ['a', null, null, 'b', null]
        i && row[i - 1] === row[i] ? null : key
      )
    );
    rows = transpose(rows);

    // get rowSpans - number of rows each level should span in the table
    let rowSpans = levels.map((level, i) => {
      return levels.slice(i + 1).reduce((accum, level) => accum * level.length, 1);
    });

    return extend(state, {levels, rows, rowSpans, max});
  }
}

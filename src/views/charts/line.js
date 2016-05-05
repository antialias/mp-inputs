import BaseView from '../base';

import template from '../templates/charts/line.jade';
import '../stylesheets/charts/line.styl';

document.registerElement('irb-line-chart', class extends HTMLElement {
  createdCallback() {
    this.$el = $('<div>').appendTo(this);
  }

  attachedCallback() {
    this.$el
      .MPChart({chartType: 'line'})
      .MPChart('setData', JSON.parse(this._data_string || {}));

    this._chart_initialized = true;
  }

  get data() {
    return JSON.parse(this._data_string);
  }

  set data(data) {
    if (this._data_string !== data) {
      this._data_string = data;

      if (this._chart_initialized) {
        this.$el.MPChart('setData', JSON.parse(data));
      }
    }
  }
});

export default class LineChartView extends BaseView {
  get TEMPLATE() {
    return template;
  }
}

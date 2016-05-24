/* global $ */

import { Component } from 'panel';
import WebComponent from 'webcomponent';

import template from './index.jade';
import './index.styl';

document.registerElement('line-chart', class extends Component {
  get config() {
    return {template};
  }
});

document.registerElement('mp-line-chart', class extends WebComponent {
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

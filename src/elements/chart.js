class Chart extends HTMLElement {
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
}

export function register() {
  document.registerElement('irb-chart', Chart);
}

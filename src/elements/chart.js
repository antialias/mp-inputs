export function register() {
  document.registerElement('irb-chart', Chart);
}

class Chart extends HTMLElement {
  createdCallback() {
    this.$el = $('<div>').appendTo(this);
  }

  attachedCallback() {
    this.$el.MPChart({chartType: 'line'});
  }

  get data() {
    return JSON.parse(this._data_string);
  }

  set data(data) {
    if (this._data_string !== data) {
      this._data_string = data;
      this.$el.MPChart('setData', JSON.parse(data));
    }
  }
}

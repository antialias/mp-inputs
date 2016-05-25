/* global $ */

import WebComponent from 'webcomponent';

import { getTickDistance } from '../chart-util';
import { abbreviateNumber, renameProperty } from '../../../util';

document.registerElement('irb-bar-chart-header', class extends WebComponent {
  createdCallback() {
    this.$el = $('<div>').appendTo(this);
  }

  render() {
    this.$el.empty();

    let $headers = $(this.headers.map(header =>
      $('<div>')
        .addClass('bar-chart-header')
        .append($('<div>').addClass('text').html(
          header === '$events' ? 'Events' : renameProperty(header)
        )).get(0)
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

import { Component } from 'panel';
import { filterObjectAtDepth } from './chart-util';

import './bar-chart';
import './line-chart';
import './table-chart';
import './chart-controls';
import './mp-toast';

import template from './index.jade';
import './index.styl';

document.registerElement('irb-result', class extends Component {
  get config() {
    return {
      helpers: {
        toastClosed: () => this.update({newCachedData: false}),
        toastSelected: () => this.app.query(),
        filterResults: (result, depth=2) => ({
          headers: result.headers,
          series: filterObjectAtDepth(result.series, series => this.state.series.data[series], depth),
        }),
      },
      template,
    };
  }
});

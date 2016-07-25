import { Component } from 'panel';
import { filterObjectAtDepth } from './chart-util';

import { pick, renameEvent } from '../../util';

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
        getBoundaries: () => pick(this.getBoundingClientRect(), ['top', 'left']),
        getChartOptions: () => pick(this.state.report, ['plotStyle']),
        getShowValueNames: () => this.state.report.sections.show.clauses.map(clause => renameEvent(clause.value.name)),
        getUniqueShowMathTypes: () => new Set(this.state.report.sections.show.clauses.map(clause => clause.math)),
        toastClosed: () => this.update({newCachedData: false}),
        toastSelected: () => this.app.query(),
        filterResults: (result, depth=2) => ({
          headers: result.headers,
          series: filterObjectAtDepth(
            result.series, series => this.state.report.series.data[series], depth
          ),
        }),
      },
      template,
    };
  }
});

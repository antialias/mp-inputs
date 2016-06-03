import Toggle from '../../widgets/toggle';
import { Component } from 'panel';
import { Pane, PaneContent } from '../../pane';

import { extend } from '../../../util';
import { renameEvent, renamePropertyValue } from '../../../util';

import template from './index.jade';
import showHideSeriesTemplate from './show-hide-series.jade';
import showHideSeriesPaneContentTemplate from './show-hide-series-pane-content.jade';
import './index.styl';

const CHART_TYPES = ['bar', 'line', 'table'];

document.registerElement('chart-toggle', class extends Toggle {
  get choices() {
    return CHART_TYPES;
  }

  formatChoiceClass(choice) {
    return `chart-type-${choice}`;
  }

  select(chartType) {
    this.app.update({chartType});
  }

  get selected() {
    return this.state.chartType;
  }
});

document.registerElement('show-hide-series-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: showHideSeriesPaneContentTemplate,

      helpers: extend(super.config.helpers, {
        isSeriesShowing: name => this.state.series.data[name],
        renameSeries: name => this.app.state.series.currentSeries === '$event' ? renameEvent(name) : renamePropertyValue(name),
        matchesSearch: value => (
          this.app.state.series && (
            !this.app.state.series.search ||
            this.config.helpers.renameSeries(value).toLowerCase().indexOf(this.app.state.series.search.toLowerCase()) === 0
          )
        ),
        resetSeries: () => this.app.updateSeriesData(this.app.state.result, false),
        selectedSeriesCount: () => Object.values(this.app.state.series.data).filter(Boolean).length,
        seriesData: () => Object.keys(this.app.state.series.data).filter(this.config.helpers.matchesSearch),
        toggleShowSeries: name => {
          const currentData = this.app.state.series.data;
          if (currentData.hasOwnProperty(name)) {
            const newSeriesValue = {};
            newSeriesValue[name] = !currentData[name];
            this.app.updateSeriesState({data: extend(currentData, newSeriesValue)});
          }
        },
        totalSeriesCount: () => Object.keys(this.app.state.series.data).length,
      }),
    });
  }
});

document.registerElement('show-hide-series-pane', class extends Pane {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        searchHandler: ev => {
          this.app.updateSeriesState({search: ev.target.value});
        },
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      header: 'Show | Hide',
    });
  }

  get section() {
    return 'show-hide-series';
  }
});

document.registerElement('show-hide-series', class extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, 'stopEditingSeries');
  }

  get config() {
    return {
      template: showHideSeriesTemplate,

      helpers: {
        startEditingSeries: () => this.app.startEditingSeries(),
      },
    };
  }
});

document.registerElement('chart-controls', class extends Component {
  get config() {
    return extend(super.config, {template});
  }
});

import BaseApp from '../../base-app';
import Toggle from '../../widgets/toggle';
import { Pane, PaneContent } from '../../pane';

import { extend, renameEvent, renamePropertyValue } from '../../../util';

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
    if (chartType === 'table') { return; } // TODO: remove when we add pivot table
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
        isSeriesShowing: name => this.app.state.series.data[name],
        renameSeries: name => this.app.state.series.currentSeries === null ? renameEvent(name) : renamePropertyValue(name),
        matchesSearch: value => (
          this.app.state.series && (
            !this.app.state.series.search ||
            this.config.helpers.renameSeries(value).toLowerCase().indexOf(this.app.state.series.search.toLowerCase()) === 0
          )
        ),
        resetSeries: () => {this.app.updateSeriesData(this.app.state.result, false);},
        selectedSeriesCount: () => Object.values(this.app.state.series.data).filter(Boolean).length,
        seriesData: () => Object.keys(this.app.state.series.data).filter(this.config.helpers.matchesSearch),
        toggleShowSeries: name => {
          const currentData = this.app.state.series.data;
          if (currentData.hasOwnProperty(name)) {
            const newSeriesValue = {};
            newSeriesValue[name] = !currentData[name];
            this.app._updateSeriesState({data: extend(currentData, newSeriesValue)});
          }
        },
        totalSeriesCount: () => Object.keys(this.app.state.series.data).length,
      }),
    });
  }
});

document.registerElement('show-hide-series-pane', class extends Pane {
  get subpanes() {
    return [
      {
        tag: 'show-hide-series-pane-content',
        constants: {
          header: 'Segments',
        },
      },
    ];
  }

  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        searchHandler: event => {
          this.app._updateSeriesState({search: event.target.value});
        },
      }),
    });
  }
});

document.registerElement('show-hide-series', class extends BaseApp {
  attachedCallback() {
    super.attachedCallback(...arguments);
    this.app.onClickOutside(this.tagName, 'stopEditingSeries');
  }

  get config() {
    return {
      template: showHideSeriesTemplate,

      helpers: {
        isEditingSeries: () => this.app.state.series.isEditing,
        startEditingSeries: () => this.app.startEditingSeries(),
      },
    };
  }
});

document.registerElement('chart-controls', class extends BaseApp {
  get config() {
    return extend(super.config, {template});
  }
});

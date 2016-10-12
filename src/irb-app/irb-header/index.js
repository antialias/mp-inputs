import { Component } from 'panel';
import { downloadData } from 'mixpanel-common/report/util';

import './mp-button-input';

import template from './index.jade';
import './index.styl';

// TODO move me
/* global require */
const SVG_ICONS = {};
const svgIconContext = require.context(`mixpanel-common/assets/icons`);
svgIconContext.keys().forEach(filename => {
  const iconName = filename.match(/([^\/]+)\.svg$/)[1];
  SVG_ICONS[iconName] = svgIconContext(filename);
});

import WebComponent from 'webcomponent';
document.registerElement(`svg-icon`, class extends WebComponent {
  attachedCallback() {
    this.render();
    this._initialized = true;
  }

  attributeChangedCallback() {
    if (this._initialized) {
      this.render();
    }
  }

  render() {
    this.innerHTML = SVG_ICONS[this.getAttribute(`icon`)];
  }
});

document.registerElement(`irb-header`, class extends Component {
  get config() {
    return {
      helpers: {
        refresh: () => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.app.query({useCache: false});
          this.app.trackEvent(`Refresh Report`, reportTrackingData);
        },

        reportListEnabled: () => !!Object.keys(this.state.savedReports).length,
        updateTitle: ev => {
          if (ev.detail) {
            this.app.updateReport({title: ev.detail.value});
            if (ev.detail.save) {
              this.app.saveReport();
            }
          }
        },

        clickExportCSV: () => {
          if (!this.state.resultLoading) {
            this.app.queries.segmentation
              .build(this.state)
              .buildJQLArgs()
              .map(queryArgs => queryArgs.then(queryArgs => {
                this.downloadJQLQuery(queryArgs[1].script, this.state.report.title, queryArgs[1].params);
              }));
          }
        },
        clickReportList: () => {
          if (this.config.helpers.reportListEnabled()) {
            this.app.openReportList();
          }
        },
      },
      template,
    };
  }

  downloadJQLQuery(script, filename, scriptParams) {
    const parameters = {
      script: script.replace(/\r/g, ``).replace(/\n/g, `\r\n`),
      download_file: `${filename}.csv`, // eslint-disable-line camelcase
      params: scriptParams,
      format: `csv`,
    };

    const query = window.MP.api.getQueryOptions(`/api/2.0/jql/`, parameters, {type: `POST`});
    downloadData(query.endpoint, query.queryOptions.data);
  }
});

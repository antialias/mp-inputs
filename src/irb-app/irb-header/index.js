import { Component } from 'panel';
import { downloadData } from 'mixpanel-common/report/util';

import './mp-button-input';

import template from './index.jade';
import './index.styl';

document.registerElement(`irb-header`, class extends Component {
  get config() {
    return {
      helpers: {
        refresh: () => {
          if (this.state.projectHasEvents) {
            const reportTrackingData = this.state.report.toTrackingData();
            this.app.query({useCache: false});
            this.app.trackEvent(`Refresh Report`, reportTrackingData);
          }
        },

        reportListEnabled: () => this.state.projectHasEvents && !!Object.keys(this.state.savedReports).length,
        updateTitle: ev => {
          if (ev.detail) {
            this.app.updateReport({title: ev.detail.value});
            if (ev.detail.save) {
              this.app.saveReport();
            }
          }
        },

        clickExportCSV: () => {
          if (!this.state.resultLoading && this.state.projectHasEvents) {
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

import md5 from 'md5';
import { downloadData } from 'mixpanel-common/report/util';
import { Component } from 'panel';

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

        titleInputDisabled: () => !this.app.hasWritePermissions || !this.state.projectHasEvents,

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
        clickReportList: () => this.app.openReportList(),
      },
      template,
    };
  }

  downloadJQLQuery(script, filename, scriptParams) {
    /* eslint-disable camelcase */
    const params = {
      api_key: this.app.apiKey,
      script: script.replace(/\r/g, ``).replace(/\n/g, `\r\n`),
      download_file: `${filename}.csv`,
      expire: Math.ceil(new Date().getTime() / 1000) + 60 * 60,
      params: scriptParams,
      format: `csv`,
    };
    /* eslint-enable camelcase */

    // compute sig, because we can't send basic auth headers with
    // POST-to-iframe download hack
    let sigStr = Object.keys(params)
      .sort()
      .reduce((str, k) => str + `${k}=${params[k]}`, ``);
    sigStr += this.app.apiSecret;
    params.sig = md5(sigStr);

    downloadData(`${this.app.apiHost}/api/2.0/jql/`, params);
  }
});

import { Component } from 'panel';

import { dataToCSV } from '../../util/csv';

import './mp-button-input';

import template from './index.jade';
import './index.styl';

document.registerElement(`irb-header`, class extends Component {
  get config() {
    return {
      helpers: {
        bookmarkLimit: () => this.app.getFeatureGateValue(`max_saved_reports`),
        bookmarkUrl: () => this.app.bookmarkCountUrl(),

        refresh: () => {
          if (this.state.projectHasEvents) {
            const reportTrackingData = this.state.report.toTrackingData();
            this.app.query({useCache: false});
            this.app.trackEvent(`Refresh Report`, reportTrackingData);
          }
        },

        titleInputEnabled: () => this.app.hasWritePermissions && this.state.projectHasEvents,

        updateTitle: ev => {
          if (ev.detail) {
            this.app.updateReport({title: ev.detail.value});
            if (ev.detail.save) {
              this.resetSaveFeedback();
              clearTimeout(this.saveFeedbackTimeout);
              this.app.saveReport()
                .then(() => this.update({saved: true}))
                .catch(() => this.update({saveFailed: true}))
                // TODO extract and share this duration, also used in add-to-dash
                .then(() => this.saveFeedbackTimeout = setTimeout(() => this.resetSaveFeedback(), 3300));
            }
          }
        },

        clickExportCSV: () => {
          if (!this.state.resultLoading && this.state.projectHasEvents) {
            const report = this.state.report;
            this.downloadData(report.title, dataToCSV(this.state.result, {
              timeUnit: report.timeUnit(),
            }));
          }
        },
        clickReportList: () => this.app.openReportList(),
      },
      template,
    };
  }

  resetSaveFeedback() {
    this.update({saved: false, saveFailed: false});
  }

  downloadData(filename, dataStr) {
    // prepare blob
    const blob = new Blob([dataStr], {type: `octet/stream`});
    const blobURL = URL.createObjectURL(blob);

    // launch named download via hidden link
    const link = document.createElement(`a`);
    link.style.display = `none`;
    link.href = blobURL;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();

    // clean up
    URL.revokeObjectURL(blobURL);
    link.remove();
  }
});

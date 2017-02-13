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

        titleInputEnabled: () => this.app.hasWritePermissions && this.state.projectHasEvents,

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
            this.downloadData(this.state.report.title, `Date,Chrome,Firefox`); // DUMMY DATA
          }
        },
        clickReportList: () => this.app.openReportList(),
      },
      template,
    };
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

import { Component } from 'panel';
import { downloadData } from 'mixpanel-common/build/util';

import './auto-sizing-input';

import template from './index.jade';
import './index.styl';

document.registerElement('irb-header', class extends Component {
  get config() {
    return {
      helpers: {
        blurTitleInput: () => this.update({editingTitle: false}),
        focusTitleInput: () => this.update({editingTitle: true}),

        refresh: () => this.app.query({useCache: false}),
        save: () => this.app.saveReport(),
        updateReportTitle: ev => this.app.updateReport({title: ev.target.value}),

        clickExportCSV: () => {
          if (!this.state.result.loading) {
            this.app.queries.segmentation.build(this.state).getParams().forEach(query => {
              this.downloadJQLQuery(query.script, this.state.reportName, query.params);
            });
          }
        },
      },
      template,
    };
  }

  downloadJQLQuery(script, filename, scriptParams) {
    const parameters = {
      script: script.replace(/\r/g, '').replace(/\n/g, '\r\n'),
      download_file: `${filename}.csv`,
      params: scriptParams,
      format: 'csv',
    };

    const query = window.MP.api.getQueryOptions('/api/2.0/jql/', parameters, {type: 'POST'});
    downloadData(query.endpoint, query.queryOptions.data);
  }
});

import { Component } from 'panel';
import { downloadJQLQuery } from 'mixpanel-common/build/util';

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
              downloadJQLQuery(query.script, this.state.reportName, query.params);
            });
          }
        },
      },

      template,
    };
  }

});

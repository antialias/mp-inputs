import { Component } from 'panel';

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
      },

      template,
    };
  }
});

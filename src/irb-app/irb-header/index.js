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
        refresh: () => this.app.query(this.state, false),
        updateReportName: ev => this.update({reportName: ev.target.value}),
      },

      template,
    };
  }
});

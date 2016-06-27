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

        clickExportCSV: () => {
          this.app.queries.segmentation.build(this.state).getParams().forEach(query => {
            this.startDownload(query.script, `${this.state.reportName}`, query.params);
          });
        },
      },

      template,
    };
  }

  htmlEncodeString(string) {
    return string.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\r/g, '&#013;')
      .replace(/\n/g, '&#010;')
      ;
  }

  startDownload(script, filename, params=null, format='csv') {
    // prepare form data
    let parameters = {
      script: script.replace(/\r/g, '').replace(/\n/g, '\r\n'),
      download_file: `${filename}.${format}`,
      params: params || {},
    };
    if (format === 'csv') {
      parameters.format = 'csv';
    }

    const query = window.MP.api.getQueryOptions('/api/2.0/jql/', parameters, {type: 'POST'});

    // prepare target iframe
    this.idCounter = this.idCounter ? this.idCounter + 1 : 1;
    const exportFrameID = `export-frame-${this.idCounter}`;
    let exportFrame = document.createElement('iframe');
    exportFrame.id = exportFrameID;
    exportFrame.name = exportFrameID;
    exportFrame.src = '';
    exportFrame.style.display = 'none';
    document.body.appendChild(exportFrame);

    // submit request
    let postForm = document.createElement('form');
    postForm.action = query.endpoint;
    postForm.method = 'POST';
    postForm.style.display = 'none';
    postForm.target = exportFrameID;
    postForm.innerHTML = Object.keys(query.queryOptions.data).map(param => {
      switch (param) {
        case 'script':
          return `<textarea name="script">${this.htmlEncodeString(parameters.script)}</textarea>`;
        case 'params':
          return `<input type="hidden" name="params" value="${this.htmlEncodeString(parameters.params)}"/>`;
        default:
          return `<input type="hidden" name="${param}" value="${query.queryOptions.data[param]}"/>`;
      }
    }).join('');
    document.body.appendChild(postForm);
    postForm.submit();
  }
});

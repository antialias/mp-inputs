import { Component } from 'panel';

import './focus-input';

import template from './index.jade';
import './index.styl';

export class Pane extends Component {
  get config() {
    return {
      template,

      helpers: {
        updateStageClause: clauseData => this.app.updateStageClause(clauseData),
      },
    };
  }

  get constants() {
    return {
      search: true,
    };
  }
}

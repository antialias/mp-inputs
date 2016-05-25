import { Component } from 'panel';

import './focus-input';

import template from './index.jade';
import './index.styl';

export class Pane extends Component {
  get config() {
    return {
      template,

      helpers: {
        searchHandler: event => {
          this.config.helpers.updateStageClause({search: event.target.value});
        },
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

export class PaneContent extends Component {
  get config() {
    return {
      helpers: {
        commitStageClause: () => this.app.commitStageClause(),
        matchesSearch: value => (
          this.state.stageClause && (
            !this.state.stageClause.search ||
            value.toLowerCase().indexOf(this.state.stageClause.search.toLowerCase()) === 0
          )
        ),
        updateStageClause: (clauseData, commit) => {
          this.app.updateStageClause(clauseData);
          if (commit) {
            this.app.commitStageClause();
          }
        },
      },
    };
  }

  isPaneActive() {
    return this.isAttributeEnabled('is-pane-active');
  }
}

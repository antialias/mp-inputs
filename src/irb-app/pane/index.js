import { Component } from 'panel';

import './focus-input';

import template from './index.jade';
import './index.styl';

export class Pane extends Component {
  get config() {
    return {
      template,

      helpers: {
        backButtonHandler: () => {
          window.requestAnimationFrame(() =>
            this.app.update({stageClause: this.state.stageClause.slice(0, -1)})
          );
        },
        searchHandler: ev => {
          this.config.helpers.updateStageClause({search: ev.target.value});
        },
        updateStageClause: clauseData => this.app.updateStageClause(clauseData),
        activePaneIndex: () => this.app.hasStageClause() ? this.app.activeStageClause.paneIndex : 0,
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

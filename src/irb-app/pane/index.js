import { Component } from 'panel';

import { ShowClause } from '../../models/clause';
import { renameEvent, sorted, stringFilterMatches } from '../../util';

import './focus-input';

import template from './index.jade';
import './index.styl';

const RESOURCE_ICONS = {
  events: `event`,
  people: `profile`,
};

export class Pane extends Component {
  get config() {
    return {
      template,

      helpers: {
        activePaneIndex: () => this.app.hasStageClause() ? this.app.activeStageClause.paneIndex : 0,
        backButtonHandler: () => {
          window.requestAnimationFrame(() =>{
            if (this.app.originStageClauseType() === `filter`) {
              this.app.updateStageClause({paneIndex: this.app.activeStageClause - 1});
            } else {
              this.app.update({stageClauses: this.state.stageClauses.slice(0, -1)});
            }
          });
        },
        changedSearch: ev => {
          this.helpers.updateStageClause({search: ev.target.value});
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
        getActiveClauseProperty: property => this.app.hasStageClause() ? this.app.activeStageClause[property] : false,
        resourceIcon: resource => RESOURCE_ICONS[resource],
        searchMatches: value => this.app.hasStageClause() && stringFilterMatches(value, this.app.activeStageClause.search),
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
    return this.isAttributeEnabled(`is-pane-active`);
  }

  get eventChoices() {
    const topEvents = sorted(this.state.topEvents, {
      transform: ev => renameEvent(ev.name).toLowerCase(),
    });
    const specialEvents = [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS];
    if (this.state.features.queryOnAllPeople && this.app.originStageClauseIsPeopleProperty()) {
      specialEvents.push(ShowClause.ALL_PEOPLE);
    }
    return specialEvents.concat(topEvents);
  }
}

import { Component } from 'panel';
import 'mixpanel-common/widgets/tutorial-tooltip';
import { ShowClause, GroupClause } from '../../models/clause';
import { extend } from '../../util';

import template from './index.jade';
import './index.styl';

document.registerElement(`irb-learn`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        getStep: () => this.step,
        clickedNext: () => {
          const modalIndex = (this.state.learn.modalIndex || 0) + 1;
          this.update({learn: extend(this.state.learn, {modalIndex})});
        },
        clickedFinish: () => {
          this.update({learn: null});
          this.navigate(``);
        },
      },
    };
  }
});

function getShowClauseEvents(state) {
  return state.report.sections[ShowClause.TYPE].clauses
    .map(clause => clause.value.name)
    .filter(mpEvent =>
      mpEvent !== ShowClause.ALL_EVENTS.name &&
      mpEvent !== ShowClause.TOP_EVENTS.name
    );
}

function getGroupClauseProperties(state) {
  return state.report.sections[GroupClause.TYPE].clauses
    .map(clause => clause.value.name);
}

const steps = [{
  name: `introduction`,
  condition: state => state.learn,
}, {
  name: `getting-started`,
  condition: state => state.learn && state.learn.modalIndex === 1,
}, {
  name: `choose-event`,
  cls: `irb-learn-choose-event`,
  condition: state => state.learn && state.learn.modalIndex === 2,
}, {
  name: `compare-event`,
  cls: `irb-learn-compare-event`,
  condition: state => getShowClauseEvents(state).length === 1,
}, {
  name: `group-by`,
  cls: `irb-learn-group-by`,
  condition: state => getShowClauseEvents(state).length === 2,
}, {
  name: `manipulate-data`,
  cls: `irb-learn-manipulate-data`,
  condition: state => getGroupClauseProperties(state).length === 1,
}, {
  name: `conclusion`,
  condition: state => (
    state.report.displayOptions.chartType !== `bar` ||
    state.report.displayOptions.value !== `absolute`
  ),
}];

export default function step(state) {
  const index = steps.length - 1 - (
    [...steps].reverse().findIndex(step => step.condition(state))
  );
  return extend(steps[index], {index});
}

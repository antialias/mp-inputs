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
        clickedNext: () => this.update({learnStepIndex: this.state.learnStepIndex + 1}),
        clickedFinish: () => {
          this.app.update({learnActive: false, learnStep: null, learnStepIndex: null});
          this.app.navigate(``);
        },
      },
    };
  }

  createdCallback() {
    super.createdCallback(...arguments);

    this.steps = [{
      name: `introduction`,
      condition: () => this.state.learnActive,
    }, {
      name: `getting-started`,
      condition: () => this.state.learnStepIndex === 1,
    }, {
      name: `choose-event`,
      cls: `irb-learn-choose-event`,
      condition: () => this.state.learnStepIndex === 2,
    }, {
      name: `compare-event`,
      cls: `irb-learn-compare-event`,
      condition: () => this.getShowClauseEvents().length === 1,
    }, {
      name: `group-by`,
      cls: `irb-learn-group-by`,
      condition: () => this.getShowClauseEvents().length === 2,
    }, {
      name: `manipulate-data`,
      cls: `irb-learn-manipulate-data`,
      condition: () => this.getGroupClauseProperties().length === 1,
    }, {
      name: `conclusion`,
      condition: () => (
        this.state.report.displayOptions.chartType !== `bar` ||
        this.state.report.displayOptions.value !== `absolute`
      ),
    }];
  }

  get step() {
    const index = this.stepIndex;
    const step = this.steps[index];

    if (step.name !== (this.state.learnStep && this.state.learnStep.name)) {
      setTimeout(() => this.update({learnStep: step, learnStepIndex: index}));
    }

    return extend(step, {index});
  }

  get stepIndex() {
    return this.steps.length - 1 - (
      [...this.steps].reverse().findIndex(step => step.condition())
    );
  }

  getShowClauseEvents() {
    return this.app
      .getClausesForType(ShowClause.TYPE)
      .map(clause => clause.value.name)
      .filter(mpEvent =>
        mpEvent !== ShowClause.ALL_EVENTS.name &&
        mpEvent !== ShowClause.TOP_EVENTS.name
      );
  }

  getGroupClauseProperties() {
    return this.app
      .getClausesForType(GroupClause.TYPE)
      .map(clause => clause.value.name);
  }
});

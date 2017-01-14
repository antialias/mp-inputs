import { ShowClause, GroupClause } from '../../models/clause';

export default class LearnFlow {
  constructor(attrs) {
    this.app = attrs.app;
    this.numModalsViewed = 1;
    this.steps = [{
      name: `introduction`,
      condition: () => this.numModalsViewed === 1,
    }, {
      name: `getting-started`,
      condition: () => this.numModalsViewed === 2,
    }, {
      name: `choose-event`,
      cls: `irb-learn-choose-event`,
      condition: () => this.numModalsViewed === 3,
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
        this.app.state.report.displayOptions.chartType !== `bar` ||
        this.app.state.report.displayOptions.value !== `absolute`
      ),
    }];
  }

  get step() {
    return [...this.steps].reverse().find(step => step.condition());
  }

  get stepIndex() {
    const currentStep = this.step;
    return this.steps.findIndex(step => step.name === currentStep.name);
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
}

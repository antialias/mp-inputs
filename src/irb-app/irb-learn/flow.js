import { ShowClause, GroupClause } from '../../models/clause';

export default class LearnFlow {
  constructor(attrs) {
    this.app = attrs.app;
    this.stepIndex = attrs.step;
    this.steps = [{
      name: `introduction`,
      cls: `irb-learn-modal`,
      condition: () => this.stepIndex === 0,
    }, {
      name: `getting-started`,
      cls: `irb-learn-modal`,
      condition: () => this.stepIndex === 1,
    }, {
      name: `choose-event`,
      cls: `irb-learn-choose-event`,
      condition: () => this.stepIndex === 2,
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
      cls: `irb-learn-modal`,
      condition: () => this.stepIndex === 6,
    }];
  }

  get step() {
    return [...this.steps].reverse().find(step => step.condition());
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

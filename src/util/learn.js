import { ShowClause, GroupClause } from '../models/clause';
import { extend } from '.';

function getShowClauseEvents(report) {
  return report.sections[ShowClause.TYPE].clauses
    .map(clause => clause.value.name)
    .filter(mpEvent =>
      mpEvent !== ShowClause.ALL_EVENTS.name &&
      mpEvent !== ShowClause.TOP_EVENTS.name
    );
}

function getGroupClauseProperties(report) {
  return report.sections[GroupClause.TYPE].clauses
    .map(clause => clause.value.name);
}

const steps = [{
  name: `introduction`,
  condition: () => true,
}, {
  name: `getting-started`,
  condition: index => index === 1,
}, {
  name: `choose-event`,
  cls: `irb-learn-choose-event`,
  condition: index => index === 2,
}, {
  name: `compare-event`,
  cls: `irb-learn-compare-event`,
  condition: (index, report) => getShowClauseEvents(report).length === 1,
}, {
  name: `group-by`,
  cls: `irb-learn-group-by`,
  condition: (index, report) => getShowClauseEvents(report).length === 2,
}, {
  name: `manipulate-data`,
  cls: `irb-learn-manipulate-data`,
  condition: (index, report) => getGroupClauseProperties(report).length === 1,
}, {
  name: `conclusion`,
  condition: (index, report) => (
    report.displayOptions.chartType !== `bar` ||
    report.displayOptions.value !== `absolute`
  ),
}];

export function getLearnStep(index, report) {
  index = steps.length - 1 - (
    [...steps].reverse().findIndex(step => step.condition(index, report))
  );
  return extend(steps[index], {index});
}

export function learnDisabledClasses({steps=[], childExceptions=[], tooltip=false}={}) {
  const childClasses = childExceptions.map(child => ({
    first: `-except-first-child`,
    last: `-except-last-child`,
  }[child] || ``));

  let classes = [];

  if (steps.length) {
    classes = steps.map((step, i) => {
      const childClass = childClasses[i] || ``;
      return `irb-learn-${step}-disabled${childClass}`;
    });
  } else if (childExceptions.length) {
    classes = childClasses.map(cls => `irb-learn-disabled${cls}`);
  } else {
    classes = [`irb-learn-disabled`];
  }

  if (tooltip) {
    classes.push(`irb-learn-tooltip-container`);
  }

  return Object.assign(...classes.map(cls => ({[cls]: true})));
}

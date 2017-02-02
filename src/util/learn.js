import { ShowClause, GroupClause } from '../models/clause';
import { extend } from '.';

const LEARN_REMINDER_DELAY_MS = 5000;

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
  name: `choose-event`,
  cls: `irb-learn-choose-event`,
  condition: index => index === 1,
  transitionOutMs: 800,
  transitionInMs: 800,
}, {
  name: `compare-event`,
  cls: `irb-learn-compare-event`,
  condition: (index, report) => getShowClauseEvents(report).length === 1,
  transitionOutMs: 800,
  transitionInMs: 800,
}, {
  name: `group-by`,
  cls: `irb-learn-group-by`,
  condition: (index, report) => getShowClauseEvents(report).length === 2,
  transitionInMs: 800,
}, {
  name: `manipulate-data`,
  cls: `irb-learn-manipulate-data`,
  condition: (index, report) => getGroupClauseProperties(report).length === 1,
  transitionOutMs: 800,
  transitionInMs: 800,
}, {
  name: `conclusion`,
  condition: (index, report) => (
    report.displayOptions.chartType !== `bar` ||
    report.displayOptions.value !== `absolute`
  ),
  transitionOutMs: 4000,
  transitionInMs: 800,
}];

export function getLearnStep(report, index) {
  index = steps.length - 1 - (
    [...steps].reverse().findIndex(step => step.condition(index, report))
  );
  return extend(steps[index], {index});
}

export function learnClasses({
  disabled=false,
  disabledSteps=[],
  disabledExceptChildren=[],
  tooltipContainer=false,
  transitioning=false,
  emphasize=false,
}={}) {
  const childClasses = disabledExceptChildren.map(child => ({
    first: `-except-first-child`,
    last: `-except-last-child`,
  }[child] || ``));

  let classes = [];

  if (disabledSteps.length) {
    classes = disabledSteps.map((step, i) => {
      const childClass = childClasses[i] || ``;
      return `irb-learn-${step}-disabled${childClass}`;
    });
  } else if (childClasses.length) {
    classes = childClasses.map(cls => `irb-learn-disabled${cls}`);
  } else if (disabled) {
    classes = [`irb-learn-disabled`];
  }

  if (tooltipContainer) {
    classes.push(`irb-learn-tooltip-container`);
  }

  if (transitioning) {
    classes.push(`irb-learn-transitioning`);
  }

  if (emphasize) {
    classes.push(`irb-learn-emphasize`);
  }

  return Object.assign(...classes.map(cls => ({[cls]: true})));
}

export function transitionLearn(report, index, {
  start=() => {},
  middle=() => {},
  end=() => {},
  startReminder=() => {},
  endReminder=() => {},
}={}) {
  const step = getLearnStep(report, index);
  const outMs = step.transitionOutMs || 0;
  const inMs = step.transitionInMs || 0;

  setTimeout(start, 0);
  setTimeout(middle, outMs);
  setTimeout(end, outMs + inMs);

  setTimeout(startReminder, LEARN_REMINDER_DELAY_MS);
  setTimeout(endReminder, LEARN_REMINDER_DELAY_MS + 1000);
}
